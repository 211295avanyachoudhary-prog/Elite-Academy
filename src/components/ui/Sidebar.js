// 🧭 Sidebar Navigation
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '⚡', label: 'Dashboard', labelJP: 'ダッシュボード' },
  { path: '/study', icon: '📚', label: 'Study Logger', labelJP: '学習記録' },
  { path: '/planner', icon: '📆', label: 'Weekly Planner', labelJP: '週間計画' },
  { path: '/leaderboard', icon: '🏆', label: 'Leaderboard', labelJP: 'ランキング' },
  { path: '/messages', icon: '💬', label: 'Messages', labelJP: 'メッセージ' },
  { path: '/focus', icon: '🎧', label: 'Focus Mode', labelJP: 'フォーカス' },
  { path: '/profile', icon: '👤', label: 'Profile', labelJP: 'プロフィール' },
];

export default function Sidebar({ theme, setTheme }) {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/auth');
    } catch {
      toast.error('Failed to log out');
    }
  }

  const classBadgeClass = userData?.currentClass || 'D';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">E</div>
        {!collapsed && (
          <div>
            <span className="sidebar-logo-text">ELITE</span>
            <span className="sidebar-logo-sub">ACADEMY</span>
          </div>
        )}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User card */}
      {!collapsed && userData && (
        <div className="sidebar-user-card">
          <div className="avatar-placeholder" style={{ width: 44, height: 44, fontSize: 18 }}>
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="avatar" className="avatar" style={{ width: 44, height: 44 }} />
            ) : (
              (userData.username || 'U')[0].toUpperCase()
            )}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{userData.username || 'Student'}</span>
            <div className="sidebar-meta">
              <span className={`class-badge ${classBadgeClass}`}>Class {classBadgeClass}</span>
              <span className="sidebar-points">⚡ {userData.points || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && (
              <div className="nav-labels">
                <span className="nav-label">{item.label}</span>
                <span className="nav-label-jp">{item.labelJP}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Theme switcher */}
      {!collapsed && (
        <div className="sidebar-themes">
          <p className="sidebar-section-title">THEME</p>
          <div className="theme-buttons">
            {['default', 'rain', 'ocean', 'night', 'minimal'].map(t => (
              <button
                key={t}
                className={`theme-btn ${theme === t ? 'active' : ''}`}
                onClick={() => setTheme(t)}
                title={t}
              >
                {t === 'default' ? '🌌' : t === 'rain' ? '🌧️' : t === 'ocean' ? '🌊' : t === 'night' ? '🌙' : '✦'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <span>🚪</span>
        {!collapsed && <span>LOGOUT</span>}
      </button>
    </aside>
  );
}
