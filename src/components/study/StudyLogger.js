// 📚 Study Logger
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logStudySession } from '../../lib/gameLogic';
import toast from 'react-hot-toast';
import './Study.css';

const SUBJECTS = [
  { id: 'physics', label: 'Physics', icon: '⚛️', jp: '物理' },
  { id: 'chemistry', label: 'Chemistry', icon: '🧪', jp: '化学' },
  { id: 'biology', label: 'Biology', icon: '🧬', jp: '生物' },
  { id: 'mathematics', label: 'Mathematics', icon: '📐', jp: '数学' },
  { id: 'english', label: 'English', icon: '📝', jp: '英語' },
  { id: 'other', label: 'Other', icon: '📖', jp: 'その他' },
];

const SUGGESTED_TOPICS = {
  physics: ['Mechanics', 'Thermodynamics', 'Electrostatics', 'Optics', 'Modern Physics', 'Waves', 'Magnetism'],
  chemistry: ['Organic Chemistry', 'Physical Chemistry', 'Inorganic Chemistry', 'Equilibrium', 'Electrochemistry', 'Coordination Compounds'],
  biology: ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology', 'Plant Biology', 'Evolution', 'Biotechnology'],
  mathematics: ['Calculus', 'Algebra', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Probability', 'Vectors'],
  english: ['Grammar', 'Reading Comprehension', 'Vocabulary', 'Writing', 'Literature'],
  other: ['Revision', 'Mock Test', 'Previous Year Papers', 'Doubt Clearing'],
};

export default function StudyLogger() {
  const { userData, refreshUserData, currentUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [hours, setHours] = useState('');
  const [topics, setTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  function toggleTopic(topic) {
    setTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  }

  function addCustomTopic() {
    if (customTopic.trim() && !topics.includes(customTopic.trim())) {
      setTopics(prev => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!subject) { toast.error('Select a subject'); return; }
    if (!hours || parseFloat(hours) <= 0) { toast.error('Enter valid study hours'); return; }
    if (topics.length === 0) { toast.error('Select at least one topic'); return; }

    setLoading(true);
    try {
      const pts = await logStudySession(currentUser.uid, {
        hours: parseFloat(hours),
        topics,
        subject,
      });
      setEarnedPoints(pts);
      setSubmitted(true);
      await refreshUserData(currentUser.uid);
      toast.success(`+${pts} points earned!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to log session');
    }
    setLoading(false);
  }

  function resetForm() {
    setSubject('');
    setHours('');
    setTopics([]);
    setCustomTopic('');
    setSubmitted(false);
    setEarnedPoints(0);
  }

  if (submitted) {
    return (
      <div className="study-logger fade-in-up">
        <div className="success-card elite-card">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Session Logged!</h2>
          <p className="success-sub">Outstanding dedication, {userData?.username}.</p>
          <div className="success-points">
            <span className="points-gained">+{earnedPoints}</span>
            <span className="points-label">POINTS EARNED</span>
          </div>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Subject</span>
              <span className="detail-value">{subject}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hours</span>
              <span className="detail-value">{hours}h</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Topics</span>
              <span className="detail-value">{topics.join(', ')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Points</span>
              <span className="detail-value neon-text">{(userData?.points || 0).toLocaleString()}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={resetForm} style={{ marginTop: 24, width: '100%' }}>
            LOG ANOTHER SESSION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-logger fade-in-up">
      <div className="page-header">
        <h1 className="page-title">STUDY LOGGER <span className="jp-small">学習記録</span></h1>
        <p className="page-sub">Log your session and earn points towards Class A</p>
      </div>

      {/* Point calculator preview */}
      {(hours || topics.length > 0) && (
        <div className="point-preview elite-card">
          <span className="preview-label">ESTIMATED POINTS</span>
          <span className="preview-points neon-text">
            +{(parseFloat(hours || 0) * 15) + (topics.length * 20)}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="study-form">
        {/* Subject selection */}
        <div className="form-section">
          <label className="form-label">SELECT SUBJECT <span className="jp-small">科目</span></label>
          <div className="subject-grid">
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                type="button"
                className={`subject-btn ${subject === s.id ? 'active' : ''}`}
                onClick={() => { setSubject(s.id); setTopics([]); }}
              >
                <span className="subject-icon">{s.icon}</span>
                <span className="subject-label">{s.label}</span>
                <span className="subject-jp">{s.jp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hours */}
        <div className="form-section">
          <label className="form-label">HOURS STUDIED <span className="jp-small">学習時間</span></label>
          <div className="hours-input-row">
            <input
              className="elite-input hours-input"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              placeholder="e.g. 2.5"
              value={hours}
              onChange={e => setHours(e.target.value)}
            />
            <div className="hours-quick">
              {[0.5, 1, 1.5, 2, 3, 4].map(h => (
                <button
                  key={h}
                  type="button"
                  className={`quick-btn ${hours == h ? 'active' : ''}`}
                  onClick={() => setHours(String(h))}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topics */}
        {subject && (
          <div className="form-section">
            <label className="form-label">TOPICS COVERED <span className="jp-small">学習トピック</span></label>
            <div className="topics-grid">
              {SUGGESTED_TOPICS[subject]?.map(topic => (
                <button
                  key={topic}
                  type="button"
                  className={`topic-btn ${topics.includes(topic) ? 'active' : ''}`}
                  onClick={() => toggleTopic(topic)}
                >
                  {topics.includes(topic) && <span>✓ </span>}
                  {topic}
                </button>
              ))}
            </div>
            {/* Custom topic */}
            <div className="custom-topic-row">
              <input
                className="elite-input"
                type="text"
                placeholder="Add custom topic..."
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
              />
              <button type="button" className="btn-secondary" onClick={addCustomTopic}>ADD</button>
            </div>
            {topics.length > 0 && (
              <div className="selected-topics">
                {topics.map(t => (
                  <span key={t} className="topic-tag" onClick={() => toggleTopic(t)}>
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary submit-btn" disabled={loading}>
          {loading ? '⏳ LOGGING...' : '⚡ LOG SESSION'}
        </button>
      </form>
    </div>
  );
}
