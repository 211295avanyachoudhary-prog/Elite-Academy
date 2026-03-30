// 📊 Dashboard - Main Hub
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { PROMOTION_THRESHOLDS, CLASS_ORDER } from '../../lib/gameLogic';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function getNextClassThreshold(currentClass, points) {
  const idx = CLASS_ORDER.indexOf(currentClass);
  if (idx === CLASS_ORDER.length - 1) return { nextClass: null, needed: 0, progress: 100 };
  const nextClass = CLASS_ORDER[idx + 1];
  const current = PROMOTION_THRESHOLDS[currentClass];
  const next = PROMOTION_THRESHOLDS[nextClass];
  const progress = Math.min(100, ((points - current) / (next - current)) * 100);
  return { nextClass, needed: next - points, progress };
}

export default function Dashboard() {
  const { userData } = useAuth();
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) return;
    async function fetchLogs() {
      const logsRef = collection(db, 'studyLogs');
      const q = query(
        logsRef,
        where('userId', '==', userData.uid),
        orderBy('date', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      setRecentLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchLogs();
  }, [userData]);

  if (!userData) return null;

  const { nextClass, needed, progress } = getNextClassThreshold(
    userData.currentClass, userData.points
  );

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="dashboard fade-in-up">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-greeting">{greeting}, {dayOfWeek}</p>
          <h1 className="dashboard-welcome">
            Welcome back, <span className="neon-text">{userData.username}</span>
          </h1>
          <p className="dashboard-jp">エリートへの道は今日も続く</p>
        </div>
        <div className="dashboard-streak-badge">
          <span className="streak-fire">🔥</span>
          <span className="streak-count">{userData.streak || 0}</span>
          <span className="streak-label">DAY STREAK</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card elite-card">
          <div className="stat-icon">⚡</div>
          <div>
            <div className="stat-value">{(userData.points || 0).toLocaleString()}</div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>
        <div className="stat-card elite-card">
          <div className="stat-icon">📚</div>
          <div>
            <div className="stat-value">{(userData.totalStudyHours || 0).toFixed(1)}h</div>
            <div className="stat-label">Study Hours</div>
          </div>
        </div>
        <div className="stat-card elite-card">
          <div className="stat-icon">🏫</div>
          <div>
            <div className="stat-value">#{userData.classroomNumber || 1}</div>
            <div className="stat-label">Classroom</div>
          </div>
        </div>
        <div className="stat-card elite-card">
          <div className="stat-icon">🎯</div>
          <div>
            <span className={`class-badge ${userData.currentClass}`} style={{ fontSize: 18, padding: '6px 14px' }}>
              Class {userData.currentClass}
            </span>
            <div className="stat-label" style={{ marginTop: 4 }}>Current Rank</div>
          </div>
        </div>
      </div>

      {/* Progress to next class */}
      {nextClass && (
        <div className="progress-card elite-card">
          <div className="progress-header">
            <div>
              <h3 className="progress-title">Path to Class {nextClass}</h3>
              <p className="progress-sub">
                {needed > 0 ? `${needed} more points to reach Class ${nextClass}` : 'Promotion pending!'}
              </p>
            </div>
            <div className="progress-classes">
              <span className={`class-badge ${userData.currentClass}`}>Class {userData.currentClass}</span>
              <span className="progress-arrow">→</span>
              <span className={`class-badge ${nextClass}`}>Class {nextClass}</span>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: 16 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-percent">{Math.floor(progress)}%</div>
        </div>
      )}

      {userData.currentClass === 'A' && (
        <div className="elite-card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--class-a)' }}>CLASS A ELITE</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>You've reached the pinnacle. Maintain your excellence.</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="quick-actions">
        <h2 className="section-title">QUICK ACTIONS <span className="jp-small">クイックアクション</span></h2>
        <div className="action-grid">
          <Link to="/study" className="action-card elite-card">
            <div className="action-icon">📝</div>
            <div className="action-label">Log Study Session</div>
            <div className="action-sub">Record hours & earn points</div>
          </Link>
          <Link to="/focus" className="action-card elite-card">
            <div className="action-icon">🎧</div>
            <div className="action-label">Focus Mode</div>
            <div className="action-sub">Deep work with ambient audio</div>
          </Link>
          <Link to="/leaderboard" className="action-card elite-card">
            <div className="action-icon">🏆</div>
            <div className="action-label">Leaderboard</div>
            <div className="action-sub">See your class ranking</div>
          </Link>
          <Link to="/planner" className="action-card elite-card">
            <div className="action-icon">📆</div>
            <div className="action-label">Weekly Planner</div>
            <div className="action-sub">Plan your study schedule</div>
          </Link>
        </div>
      </div>

      {/* Recent study logs */}
      <div className="recent-logs">
        <h2 className="section-title">RECENT SESSIONS <span className="jp-small">最近の学習</span></h2>
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : recentLogs.length === 0 ? (
          <div className="empty-state elite-card">
            <p>No study sessions yet. <Link to="/study">Start logging!</Link></p>
          </div>
        ) : (
          <div className="logs-list">
            {recentLogs.map(log => (
              <div key={log.id} className="log-item elite-card">
                <div className="log-subject-icon">📖</div>
                <div className="log-info">
                  <div className="log-subject">{log.subject}</div>
                  <div className="log-topics">{log.topics?.join(', ')}</div>
                </div>
                <div className="log-stats">
                  <div className="log-hours">{log.hours}h</div>
                  <div className="log-points">+{log.pointsEarned} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational quote */}
      <div className="motivation-card elite-card">
        <p className="motivation-quote">
          "The difference between ordinary and extraordinary is that little extra."
        </p>
        <p className="motivation-author">— Elite Academy</p>
      </div>
    </div>
  );
}
