// 🔐 Auth Page - Login & Signup
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back, Elite Student!');
      } else {
        if (username.length < 3) {
          toast.error('Username must be at least 3 characters');
          setLoading(false);
          return;
        }
        await signup(email, password, username);
        toast.success('Enrolled in Elite Academy! Welcome to Class D.');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') toast.error('Email already registered.');
      else if (err.code === 'auth/wrong-password') toast.error('Incorrect password.');
      else if (err.code === 'auth/user-not-found') toast.error('No account found with this email.');
      else if (err.code === 'auth/weak-password') toast.error('Password must be at least 6 characters.');
      else toast.error('An error occurred. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-panel fade-in-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="logo-text">E</span>
          </div>
          <div>
            <h1 className="auth-title">ELITE ACADEMY</h1>
            <p className="auth-subtitle">エリートアカデミー</p>
          </div>
        </div>

        <p className="auth-tagline">
          {isLogin ? 'Welcome back, Student.' : 'Your journey to Class A begins here.'}
        </p>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            LOGIN
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            ENROLL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-field">
              <label>USERNAME</label>
              <input
                className="elite-input"
                type="text"
                placeholder="Your codename..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>EMAIL</label>
            <input
              className="elite-input"
              type="email"
              placeholder="student@academy.jp"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>PASSWORD</label>
            <input
              className="elite-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-dots">
                <span />
                <span />
                <span />
              </span>
            ) : isLogin ? 'LOGIN' : 'BEGIN ENROLLMENT'}
          </button>
        </form>

        {!isLogin && (
          <p className="auth-note">
            New students are automatically placed in <strong>Class D</strong>.
            Rise to Class A through dedication and discipline.
          </p>
        )}
      </div>
    </div>
  );
}
