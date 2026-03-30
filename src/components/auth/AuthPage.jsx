// 🔐 Auth Page — Login & Signup
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!username.trim()) { setError('Username required'); setLoading(false); return; }
        await signup(email, password, username);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-particles">
        {[...Array(20)].map((_, i) => (
          <span key={i} className="particle" style={{ '--i': i }} />
        ))}
      </div>

      <div className="auth-container">
        <div className="auth-logo">
          <span className="logo-icon">⚡</span>
          <h1>ELITE ACADEMY</h1>
          <p>Rise through the ranks. Prove your worth.</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >LOGIN</button>
            <button
              className={`tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >JOIN</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="input-group">
                <label>USERNAME</label>
                <input
                  type="text"
                  placeholder="Your codename..."
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>EMAIL</label>
              <input
                type="email"
                placeholder="student@elite.academy"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="auth-error">⚠ {error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : mode === 'login' ? 'ENTER THE ACADEMY' : 'BEGIN YOUR JOURNEY'}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="auth-note">
              🏫 You'll be assigned to <strong>Class D</strong>. Work hard to rise.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
