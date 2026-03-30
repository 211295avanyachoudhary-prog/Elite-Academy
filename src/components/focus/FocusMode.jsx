// 🎧 Focus Mode — Ambient Audio
import { useState, useRef, useEffect } from 'react';
import './Focus.css';

const SOUNDS = [
  { id: 'rain', label: 'Rain', emoji: '🌧️', color: '#4a9eff',
    url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', color: '#00d4ff',
    url: 'https://www.soundjay.com/nature/waves-1.mp3' },
  { id: 'forest', label: 'Forest', emoji: '🌿', color: '#00ff88',
    url: 'https://www.soundjay.com/nature/crickets-1.mp3' },
  { id: 'white', label: 'White Noise', emoji: '❄️', color: '#e2e8f0',
    url: null },
  { id: 'brown', label: 'Brown Noise', emoji: '🪵', color: '#CD7F32',
    url: null },
  { id: 'cafe', label: 'Café', emoji: '☕', color: '#FFD700',
    url: null }
];

const THEMES = [
  { id: 'dark', label: 'Dark', emoji: '🌑', bg: '#030712' },
  { id: 'rain', label: 'Rain', emoji: '🌧️', bg: 'linear-gradient(135deg, #0c1a2e, #1a3a5c)' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', bg: 'linear-gradient(135deg, #001a2e, #003d5c)' },
  { id: 'night', label: 'Night', emoji: '🌙', bg: 'linear-gradient(135deg, #0a0a1a, #1a0a2e)' },
  { id: 'minimal', label: 'Minimal', emoji: '⬜', bg: '#0f1117' }
];

export default function FocusMode() {
  const [activeSound, setActiveSound] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [activeTheme, setActiveTheme] = useState('dark');
  const [timer, setTimer] = useState(25 * 60); // pomodoro default
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState(25);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setTimerRunning(false);
            clearInterval(intervalRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const setTimerPreset = (mins) => {
    setTimerMode(mins);
    setTimer(mins * 60);
    setTimerRunning(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const generateNoise = (type) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else {
      // Brown noise
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
    noiseNodeRef.current = { source, gainNode };
    return gainNode;
  };

  const playSound = (sound) => {
    // Stop current
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    if (activeSound?.id === sound.id) { setActiveSound(null); return; }

    setActiveSound(sound);

    if (sound.id === 'white' || sound.id === 'brown') {
      generateNoise(sound.id);
    } else if (sound.url) {
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = volume;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  };

  const handleVolumeChange = (v) => {
    setVolume(v);
    if (noiseNodeRef.current) noiseNodeRef.current.gainNode.gain.value = v;
    if (audioRef.current) audioRef.current.volume = v;
  };

  const currentTheme = THEMES.find(t => t.id === activeTheme);
  const progress = ((timerMode * 60 - timer) / (timerMode * 60)) * 100;
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="focus-mode" style={{ background: currentTheme.bg }}>
      <h2 className="page-title focus-title">🎧 Focus Mode</h2>

      {/* Themes */}
      <div className="theme-bar">
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`theme-btn ${activeTheme === t.id ? 'active' : ''}`}
            onClick={() => setActiveTheme(t.id)}
          >{t.emoji} {t.label}</button>
        ))}
      </div>

      {/* Pomodoro Timer */}
      <div className="timer-section">
        <div className="timer-presets">
          {[25, 45, 60, 90].map(m => (
            <button
              key={m}
              className={`preset-btn ${timerMode === m ? 'active' : ''}`}
              onClick={() => setTimerPreset(m)}
            >{m}min</button>
          ))}
        </div>

        <div className="timer-ring-wrap">
          <svg viewBox="0 0 200 200" className="timer-ring">
            <circle cx="100" cy="100" r="90" className="ring-bg" />
            <circle
              cx="100" cy="100" r="90"
              className="ring-progress"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              stroke={activeSound ? activeSound.color : '#00ffff'}
            />
          </svg>
          <div className="timer-display">
            <span className="timer-time">{formatTime(timer)}</span>
            <span className="timer-label">{timerRunning ? 'FOCUS' : 'READY'}</span>
          </div>
        </div>

        <div className="timer-controls">
          <button
            className="timer-btn"
            onClick={() => setTimerRunning(r => !r)}
          >{timerRunning ? '⏸ PAUSE' : '▶ START'}</button>
          <button
            className="timer-btn reset"
            onClick={() => { setTimerRunning(false); setTimer(timerMode * 60); }}
          >↺ RESET</button>
        </div>
      </div>

      {/* Sound Selection */}
      <div className="sounds-section">
        <h3 className="section-label">AMBIENT SOUNDS</h3>
        <div className="sounds-grid">
          {SOUNDS.map(s => (
            <button
              key={s.id}
              className={`sound-btn ${activeSound?.id === s.id ? 'active' : ''}`}
              style={activeSound?.id === s.id ? { borderColor: s.color, color: s.color, boxShadow: `0 0 16px ${s.color}40` } : {}}
              onClick={() => playSound(s)}
            >
              <span className="sound-emoji">{s.emoji}</span>
              <span>{s.label}</span>
              {activeSound?.id === s.id && <span className="sound-playing">♪</span>}
            </button>
          ))}
        </div>

        {activeSound && (
          <div className="volume-control">
            <span>🔈</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              style={{ '--color': activeSound.color }}
            />
            <span>🔊</span>
          </div>
        )}
      </div>
    </div>
  );
}
