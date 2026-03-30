// 🎧 Focus Mode - Ambient Audio + Pomodoro Timer
import React, { useState, useEffect, useRef } from 'react';
import './Focus.css';

const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: '🌧️', jp: '雨' },
  { id: 'ocean', label: 'Ocean', icon: '🌊', jp: '海' },
  { id: 'whitenoise', label: 'White Noise', icon: '📡', jp: 'ホワイトノイズ' },
  { id: 'brownnoise', label: 'Brown Noise', icon: '🌫️', jp: 'ブラウンノイズ' },
  { id: 'nature', label: 'Nature', icon: '🌿', jp: '自然' },
  { id: 'cafe', label: 'Café', icon: '☕', jp: 'カフェ' },
];

// Web Audio API sound generators
function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function generateNoise(audioCtx, type = 'white') {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'white') {
      data[i] = white * 0.5;
    } else if (type === 'brown') {
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    } else { // pink approximation
      data[i] = white * 0.3;
    }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function createRainSound(audioCtx) {
  // Layered noise for rain effect
  const source = generateNoise(audioCtx, 'white');
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.8;
  source.connect(filter);
  return { source, output: filter };
}

export default function FocusMode() {
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [timerMode, setTimerMode] = useState('pomodoro'); // pomodoro, short, long, custom
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const sourceRef = useRef(null);

  const TIMER_PRESETS = {
    pomodoro: { label: 'Pomodoro', time: 25 * 60 },
    short: { label: 'Short Break', time: 5 * 60 },
    long: { label: 'Long Break', time: 15 * 60 },
    custom: { label: '45 min', time: 45 * 60 },
  };

  // Timer countdown
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setSessions(s => s + 1);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [running, timeLeft]);

  function selectTimer(mode) {
    setTimerMode(mode);
    setTimeLeft(TIMER_PRESETS[mode].time);
    setRunning(false);
  }

  function toggleTimer() {
    if (timeLeft === 0) {
      setTimeLeft(TIMER_PRESETS[timerMode].time);
      setRunning(true);
    } else {
      setRunning(r => !r);
    }
  }

  function resetTimer() {
    setRunning(false);
    setTimeLeft(TIMER_PRESETS[timerMode].time);
  }

  // Sound management using Web Audio API
  function stopSound() {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    gainRef.current = null;
  }

  async function toggleSound(soundId) {
    if (activeSound === soundId) {
      stopSound();
      setActiveSound(null);
      return;
    }

    stopSound();

    try {
      const ctx = createAudioContext();
      audioCtxRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(ctx.destination);
      gainRef.current = gainNode;

      let source, output;

      if (soundId === 'rain') {
        const result = createRainSound(ctx);
        source = result.source;
        output = result.output;
      } else if (soundId === 'whitenoise') {
        source = generateNoise(ctx, 'white');
        output = source;
      } else if (soundId === 'brownnoise') {
        source = generateNoise(ctx, 'brown');
        output = source;
      } else if (soundId === 'ocean') {
        source = generateNoise(ctx, 'pink');
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        source.connect(filter);
        output = filter;
      } else if (soundId === 'nature') {
        source = generateNoise(ctx, 'white');
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 2;
        source.connect(filter);
        output = filter;
      } else {
        // Cafe - layered low-pass brown noise
        source = generateNoise(ctx, 'brown');
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowshelf';
        filter.frequency.value = 500;
        filter.gain.value = 6;
        source.connect(filter);
        output = filter;
      }

      output.connect(gainNode);
      source.start();
      sourceRef.current = source;
      setActiveSound(soundId);
    } catch (err) {
      console.error('Audio error:', err);
    }
  }

  // Volume change
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => () => stopSound(), []);

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const totalTime = TIMER_PRESETS[timerMode].time;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="focus-mode fade-in-up">
      <div className="page-header">
        <h1 className="page-title">FOCUS MODE <span className="jp-small">集中モード</span></h1>
        <p className="page-sub">Block out the world. Enter your zone.</p>
      </div>

      <div className="focus-layout">
        {/* Timer */}
        <div className="timer-section elite-card">
          {/* Mode selector */}
          <div className="timer-modes">
            {Object.entries(TIMER_PRESETS).map(([key, val]) => (
              <button
                key={key}
                className={`timer-mode-btn ${timerMode === key ? 'active' : ''}`}
                onClick={() => selectTimer(key)}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Circular progress timer */}
          <div className="timer-circle-wrapper">
            <svg className="timer-svg" viewBox="0 0 260 260">
              {/* Background circle */}
              <circle
                cx="130" cy="130" r="110"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="130" cy="130" r="110"
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 130 130)"
                className="timer-progress-circle"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--neon-blue)" />
                  <stop offset="100%" stopColor="var(--neon-purple)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="timer-display">
              <div className="timer-time">{formatTime(timeLeft)}</div>
              <div className="timer-label">{TIMER_PRESETS[timerMode].label}</div>
              <div className="timer-sessions">Session {sessions + 1}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="timer-controls">
            <button className="timer-btn secondary" onClick={resetTimer}>↺</button>
            <button className="timer-btn primary" onClick={toggleTimer}>
              {running ? '⏸' : '▶'}
            </button>
            <div className="sessions-count">🍅 {sessions}</div>
          </div>
        </div>

        {/* Sound panel */}
        <div className="sound-section">
          <div className="sound-header">
            <h3 className="sound-title">AMBIENT SOUNDS <span className="jp-small">環境音</span></h3>
            <p className="sound-sub">Click to toggle. Adjust volume below.</p>
          </div>

          <div className="sounds-grid">
            {SOUNDS.map(sound => (
              <button
                key={sound.id}
                className={`sound-btn ${activeSound === sound.id ? 'active' : ''}`}
                onClick={() => toggleSound(sound.id)}
              >
                <span className="sound-icon">{sound.icon}</span>
                <span className="sound-label">{sound.label}</span>
                <span className="sound-jp">{sound.jp}</span>
                {activeSound === sound.id && <span className="sound-playing">▶ PLAYING</span>}
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="volume-control elite-card">
            <span className="volume-icon">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-icon">🔊</span>
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>

          {/* Study tip */}
          <div className="focus-tip elite-card">
            <div className="tip-icon">💡</div>
            <div>
              <div className="tip-title">FOCUS TIP</div>
              <div className="tip-text">
                Work for 25 minutes, then take a 5-minute break. After 4 sessions, take a longer 15-minute break.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
