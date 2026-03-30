// 👤 Profile Page
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PROMOTION_THRESHOLDS, CLASS_ORDER } from '../../lib/gameLogic';
import toast from 'react-hot-toast';
import './Profile.css';

const ACHIEVEMENTS = [
  { id: 'first_login', icon: '🌟', label: 'First Step', desc: 'Enrolled in Elite Academy' },
  { id: 'streak_7', icon: '🔥', label: 'Week Warrior', desc: '7-day study streak' },
  { id: 'streak_30', icon: '⚡', label: 'Month Master', desc: '30-day study streak' },
  { id: 'hours_10', icon: '📚', label: 'Scholar', desc: '10 hours studied' },
  { id: 'hours_50', icon: '🎓', label: 'Academic', desc: '50 hours studied' },
  { id: 'class_c', icon: '🥉', label: 'Rising', desc: 'Reached Class C' },
  { id: 'class_b', icon: '🥈', label: 'Advancing', desc: 'Reached Class B' },
  { id: 'class_a', icon: '👑', label: 'Elite', desc: 'Reached Class A' },
];

function getUnlockedAchievements(userData) {
  const unlocked = new Set(['first_login']);
  if ((userData?.streak || 0) >= 7) unlocked.add('streak_7');
  if ((userData?.streak || 0) >= 30) unlocked.add('streak_30');
  if ((userData?.totalStudyHours || 0) >= 10) unlocked.add('hours_10');
  if ((userData?.totalStudyHours || 0) >= 50) unlocked.add('hours_50');
  if (['C','B','A'].includes(userData?.currentClass)) unlocked.add('class_c');
  if (['B','A'].includes(userData?.currentClass)) unlocked.add('class_b');
  if (userData?.currentClass === 'A') unlocked.add('class_a');
  return unlocked;
}

export default function Profile() {
  const { userData, currentUser, refreshUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(userData?.username || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const unlockedAchievements = getUnlockedAchievements(userData);
  const currentClass = userData?.currentClass || 'D';
  const points = userData?.points || 0;
  const idx = CLASS_ORDER.indexOf(currentClass);
  const nextClass = idx < CLASS_ORDER.length - 1 ? CLASS_ORDER[idx + 1] : null;
  const currentThreshold = PROMOTION_THRESHOLDS[currentClass];
  const nextThreshold = nextClass ? PROMOTION_THRESHOLDS[nextClass] : null;
  const progressPct = nextThreshold
    ? Math.min(100, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: url });
      await refreshUserData(currentUser.uid);
      toast.success('Profile photo updated!');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    }
    setUploading(false);
  }

  async function handleSave() {
    if (username.trim().length < 3) { toast.error('Username too short'); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: username.trim(),
        bio: bio.trim(),
      });
      await refreshUserData(currentUser.uid);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to save');
    }
    setSaving(false);
  }

  if (!userData) return null;

  return (
    <div className="profile-page fade-in-up">
      <div className="page-header">
        <h1 className="page-title">PROFILE <span className="jp-small">プロフィール</span></h1>
      </div>
      <div className="profile-layout">
        <div className="profile-left">
          <div className="identity-card elite-card">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt="avatar" className="profile-avatar" />
                ) : (
                  <div className="avatar-placeholder profile-avatar" style={{ fontSize: 48 }}>
                    {(userData.username || 'U')[0].toUpperCase()}
                  </div>
                )}
                <label className="avatar-upload-btn" title="Change photo">
                  {uploading ? '⏳' : '📷'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
              </div>
              <span className={`class-badge ${currentClass}`} style={{ fontSize: 14, padding: '6px 16px', marginTop: 8 }}>
                Class {currentClass}
              </span>
            </div>
            {editing ? (
              <div className="edit-form">
                <div className="edit-field">
                  <label className="edit-label">USERNAME</label>
                  <input className="elite-input" value={username} onChange={e => setUsername(e.target.value)} maxLength={24} />
                </div>
                <div className="edit-field">
                  <label className="edit-label">BIO</label>
                  <textarea className="elite-input" value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={120} placeholder="Tell your story..." style={{ resize: 'vertical' }} />
                </div>
                <div className="edit-actions">
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'SAVING...' : 'SAVE'}</button>
                  <button className="btn-secondary" onClick={() => setEditing(false)}>CANCEL</button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <h2 className="profile-username">{userData.username}</h2>
                <p className="profile-bio">{userData.bio || 'No bio yet. Add one!'}</p>
                <button className="btn-secondary edit-btn" onClick={() => setEditing(true)}>✏️ EDIT PROFILE</button>
              </div>
            )}
            <div className="profile-meta">
              <div className="meta-item">
                <span className="meta-icon">🏫</span>
                <div>
                  <div className="meta-label">CLASSROOM</div>
                  <div className="meta-value">#{userData.classroomNumber || 1}</div>
                </div>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📧</span>
                <div>
                  <div className="meta-label">EMAIL</div>
                  <div className="meta-value" style={{ fontSize: 12 }}>{userData.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-right">
          <div className="stats-card elite-card">
            <h3 className="card-title">STATISTICS <span className="jp-small">統計</span></h3>
            <div className="profile-stats-grid">
              <div className="profile-stat">
                <div className="pstat-value neon-text">{points.toLocaleString()}</div>
                <div className="pstat-label">Total Points</div>
              </div>
              <div className="profile-stat">
                <div className="pstat-value" style={{ color: 'var(--neon-gold)' }}>🔥 {userData.streak || 0}</div>
                <div className="pstat-label">Day Streak</div>
              </div>
              <div className="profile-stat">
                <div className="pstat-value" style={{ color: 'var(--neon-green)' }}>{(userData.totalStudyHours || 0).toFixed(1)}h</div>
                <div className="pstat-label">Study Hours</div>
              </div>
              <div className="profile-stat">
                <div className={`pstat-value class-badge ${currentClass}`} style={{ fontSize: 20, padding: '4px 12px' }}>Class {currentClass}</div>
                <div className="pstat-label">Current Rank</div>
              </div>
            </div>
            {nextClass && (
              <div className="rank-progress">
                <div className="rank-progress-header">
                  <span>Class {currentClass}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{Math.floor(progressPct)}% to Class {nextClass}</span>
                  <span>Class {nextClass}</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                  {nextThreshold - points > 0 ? `${nextThreshold - points} points needed` : 'Promotion imminent!'}
                </div>
              </div>
            )}
          </div>
          <div className="achievements-card elite-card">
            <h3 className="card-title">ACHIEVEMENTS <span className="jp-small">実績</span></h3>
            <div className="achievements-grid">
              {ACHIEVEMENTS.map(ach => {
                const unlocked = unlockedAchievements.has(ach.id);
                return (
                  <div key={ach.id} className={`achievement-item ${unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="ach-icon">{unlocked ? ach.icon : '🔒'}</div>
                    <div className="ach-label">{ach.label}</div>
                    <div className="ach-desc">{ach.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
