// 🚀 App.js - Main router and layout
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/ui/Sidebar';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import StudyLogger from './components/study/StudyLogger';
import WeeklyPlanner from './components/study/WeeklyPlanner';
import FocusMode from './components/study/FocusMode';
import Leaderboard from './components/dashboard/Leaderboard';
import Messages from './components/chat/Messages';
import Profile from './components/profile/Profile';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" replace />;
}

function AppLayout({ theme, setTheme, children }) {
  return (
    <div className={theme !== 'default' ? `app-layout theme-${theme}` : 'app-layout'}>
      <div className="scan-overlay" />
      <Sidebar theme={theme} setTheme={setTheme} />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState('default');

  return (
    <Routes>
      <Route path="/auth" element={currentUser ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/study" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><StudyLogger /></AppLayout></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><WeeklyPlanner /></AppLayout></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><Leaderboard /></AppLayout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><Messages /></AppLayout></ProtectedRoute>} />
      <Route path="/focus" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><FocusMode /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout theme={theme} setTheme={setTheme}><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={currentUser ? '/dashboard' : '/auth'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1428',
              color: '#e8f0fe',
              border: '1px solid rgba(0,212,255,0.3)',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00ff9d', secondary: '#0d1428' } },
            error: { iconTheme: { primary: '#ff006e', secondary: '#0d1428' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
