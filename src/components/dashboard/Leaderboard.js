// 🏆 Leaderboard
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getClassroomLeaderboard, getGlobalLeaderboard } from '../../lib/gameLogic';
import './Leaderboard.css';

const RANK_ICONS = ['👑', '🥈', '🥉'];

export default function Leaderboard() {
  const { userData } = useAuth();
  const [view, setView] = useState('classroom'); // 'classroom' | 'global'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        if (view === 'classroom' && userData?.classroomId) {
          const data = await getClassroomLeaderboard(userData.classroomId);
          setLeaderboard(data);
        } else {
          const data = await getGlobalLeaderboard();
          setLeaderboard(data);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    if (userData) fetchLeaderboard();
  }, [view, userData]);

  const myRank = leaderboard.findIndex(u => u.uid === userData?.uid) + 1;

  return (
    <div className="leaderboard fade-in-up">
      <div className="page-header">
        <h1 className="page-title">LEADERBOARD <span className="jp-small">ランキング</span></h1>
        <p className="page-sub">Who rises. Who falls. The hierarchy is absolute.</p>
      </div>

      {/* View toggle */}
      <div className="lb-toggle">
        <button
          className={`lb-toggle-btn ${view === 'classroom' ? 'active' : ''}`}
          onClick={() => setView('classroom')}
        >
          🏫 CLASSROOM #{userData?.classroomNumber}
        </button>
        <button
          className={`lb-toggle-btn ${view === 'global' ? 'active' : ''}`}
          onClick={() => setView('global')}
        >
          🌍 GLOBAL TOP 50
        </button>
      </div>

      {/* My rank card */}
      {myRank > 0 && (
        <div className="my-rank-card elite-card">
          <div className="my-rank-label">YOUR RANK</div>
          <div className="my-rank-number">#{myRank}</div>
          <div className="my-rank-details">
            <span className={`class-badge ${userData?.currentClass}`}>Class {userData?.currentClass}</span>
            <span className="my-rank-points">⚡ {userData?.points?.toLocaleString()} pts</span>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {loading ? (
        <div className="loading-state">LOADING RANKINGS...</div>
      ) : (
        <div className="lb-list">
          {leaderboard.map((user, idx) => (
            <div
              key={user.id}
              className={`lb-item elite-card ${user.uid === userData?.uid ? 'my-entry' : ''} ${idx < 3 ? 'top-three' : ''}`}
            >
              <div className="lb-rank">
                {idx < 3 ? (
                  <span className="rank-icon">{RANK_ICONS[idx]}</span>
                ) : (
                  <span className="rank-num">#{idx + 1}</span>
                )}
              </div>

              <div className="lb-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.username} className="avatar" style={{ width: 40, height: 40 }} />
                ) : (
                  <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: 16 }}>
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="lb-info">
                <div className="lb-username">
                  {user.username}
                  {user.uid === userData?.uid && <span className="you-badge"> YOU</span>}
                </div>
                <div className="lb-meta">
                  <span className={`class-badge ${user.currentClass}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                    Class {user.currentClass}
                  </span>
                  <span className="lb-streak">🔥 {user.streak || 0}</span>
                  <span className="lb-hours">📚 {(user.totalStudyHours || 0).toFixed(1)}h</span>
                </div>
              </div>

              <div className="lb-points">
                <div className="lb-points-value">{(user.points || 0).toLocaleString()}</div>
                <div className="lb-points-label">PTS</div>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="empty-state elite-card">
              <p>No students yet. Be the first to earn points!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
