// 📊 Dashboard — Main Hub
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getClassColor } from '../../utils/classroom';
import './Dashboard.css';

export default function Dashboard({ onNavigate }) {
  const { userData } = useAuth();
  const [topStudents, setTopStudents] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    if (!userData) return;
    fetchLeaderboard();
    fetchRecentLogs();
  }, [userData]);

  const fetchLeaderboard = async () => {
    const q = query(
      collection(db, 'users'),
      where('classroomId', '==', userData.classroomId),
      orderBy('points', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);
    setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchRecentLogs = async () => {
    const q = query(
      collection(db, 'studyLogs'),
      where('userId', '==', userData.uid || ''),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    try {
      const snap = await getDocs(q);
      setRecentLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setRecentLogs([]); }
  };

  const progressToNext = () => {
    const thresholds = { D: 500, C: 1500, B: 3000, A: 9999 };
    const cls = userData?.currentClass || 'D';
    const max = thresholds[cls];
    const pts = userData?.points || 0;
    return Math.min((pts / max) * 100, 100).toFixed(1);
  };

  if (!userData) return <div className="loading-screen"><span className="spinner-lg" /></div>;

  const classColor = getClassColor(userData.currentClass);

  return (
    <div className="dashboard">
      {/* Hero Card */}
      <div className="dash-hero" style={{ '--class-color': classColor }}>
        <div className="hero-left">
          <div className="user-avatar">
            {userData.photoURL
              ? <img src={userData.photoURL} alt="avatar" />
              : <span>{userData.username?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <div className="hero-info">
            <h2>{userData.username}</h2>
            <div className="class-badge" style={{ color: classColor, borderColor: classColor }}>
              CLASS {userData.currentClass}
            </div>
            <p>Classroom #{userData.classroomNumber}</p>
          </div>
        </div>
        <div className="hero-right">
          <div className="stat-big">
            <span className="stat-number">{userData.points || 0}</span>
            <span className="stat-label">POINTS</span>
          </div>
          <div className="stat-big">
            <span className="stat-number">🔥{userData.streak || 0}</span>
            <span className="stat-label">STREAK</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span>Progress to next class</span>
          <span style={{ color: classColor }}>{progressToNext()}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressToNext()}%`, background: classColor }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-card" onClick={() => onNavigate('study')}>
          <span className="action-icon">📚</span>
          <span>Log Study</span>
        </button>
        <button className="action-card" onClick={() => onNavigate('focus')}>
          <span className="action-icon">🎧</span>
          <span>Focus Mode</span>
        </button>
        <button className="action-card" onClick={() => onNavigate('planner')}>
          <span className="action-icon">📆</span>
          <span>Planner</span>
        </button>
        <button className="action-card" onClick={() => onNavigate('chat')}>
          <span className="action-icon">💬</span>
          <span>Messages</span>
        </button>
      </div>

      {/* Classroom Leaderboard */}
      <div className="section-card">
        <h3 className="section-title">🏆 Classroom Leaderboard</h3>
        <div className="leaderboard-list">
          {topStudents.map((student, idx) => (
            <div key={student.id} className="lb-row">
              <span className="lb-rank" style={{ color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#718096' }}>
                #{idx + 1}
              </span>
              <div className="lb-avatar">
                {student.photoURL
                  ? <img src={student.photoURL} alt="" />
                  : <span>{student.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <span className="lb-name">{student.username}</span>
              <span className="lb-class" style={{ color: getClassColor(student.currentClass) }}>
                {student.currentClass}
              </span>
              <span className="lb-pts">{student.points} pts</span>
            </div>
          ))}
          {topStudents.length === 0 && (
            <p className="empty-state">Be the first to log a study session!</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <div className="section-card">
          <h3 className="section-title">📋 Recent Sessions</h3>
          {recentLogs.map(log => (
            <div key={log.id} className="log-row">
              <span className="log-subject">{log.subject}</span>
              <span className="log-hours">{log.hoursStudied}h</span>
              <span className="log-pts">+{log.pointsEarned} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
