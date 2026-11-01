import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Bell,
  Compass,
  HelpCircle,
  Layers,
  User as UserIcon,
  GraduationCap,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import AuthModal from './components/AuthModal';
import VerificationSection from './components/VerificationSection';

export default function App() {
  const [health, setHealth] = useState({
    loading: true,
    status: 'checking',
    data: null,
    error: null
  });

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pharmalink_token') || null);
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'verification'

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHealth({
          loading: false,
          status: 'online',
          data,
          error: null
        });
      })
      .catch((err) => {
        setHealth({
          loading: false,
          status: 'offline',
          data: null,
          error: err.message
        });
      });
  }, []);

  // Fetch authenticated session if token exists
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('pharmalink_token');
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('pharmalink_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('pharmalink_token');
    setToken(null);
    setUser(null);
    setActiveView('feed');
  };

  const handleStatusUpdated = (newStatus) => {
    if (user) {
      setUser({ ...user, verificationStatus: newStatus });
    }
  };

  return (
    <div className="app-container" data-testid="pharmalink-app">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-badge">PANS</div>
          <div className="brand-title">
            PharmaLink UNILAG
            <span className="tagline">| Where UNILAG Pharmacy Links</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div className="user-badge" data-testid="user-session-badge">
              <UserIcon size={14} />
              <span><strong>{user.fullName}</strong> ({user.level})</span>
              {user.verificationStatus === 'verified' && (
                <span title="Verified Pharmacy Student" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <CheckCircle2 size={13} color="var(--success)" />
                </span>
              )}
              <button onClick={handleLogout} className="logout-btn" title="Sign Out">
                <LogOut size={13} />
              </button>
            </div>
          ) : null}

          {health.status === 'online' ? (
            <span className="status-pill online" data-testid="api-status-online">
              <span className="indicator-dot"></span>
              Core API Connected
            </span>
          ) : (
            <span className="status-pill offline" data-testid="api-status-offline">
              <span className="indicator-dot"></span>
              {health.loading ? 'Connecting API...' : 'API Detached'}
            </span>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <a
            href="#feed"
            className={`nav-link ${activeView === 'feed' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveView('feed'); }}
            data-testid="nav-feed"
          >
            <Compass />
            <span>Social Feed</span>
          </a>
          <a
            href="#verification"
            className={`nav-link ${activeView === 'verification' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActiveView('verification'); }}
            data-testid="nav-verification"
          >
            <ShieldCheck />
            <span>Student Verification</span>
          </a>
          <a href="#vault" className="nav-link" data-testid="nav-vault">
            <BookOpen />
            <span>Materials Vault</span>
          </a>
          <a href="#levels" className="nav-link" data-testid="nav-levels">
            <GraduationCap />
            <span>Levels (200L–500L)</span>
          </a>
          <a href="#pans" className="nav-link" data-testid="nav-pans">
            <Bell />
            <span>PANS Official</span>
          </a>
          <a href="#quizzes" className="nav-link" data-testid="nav-quizzes">
            <Layers />
            <span>Daily Dose Quizzes</span>
          </a>
          <a href="#support" className="nav-link" data-testid="nav-support">
            <HelpCircle />
            <span>Help & Guidelines</span>
          </a>
        </aside>

        {/* Content */}
        <main className="main-content">
          <div className="notice-box">
            <strong>Welcome to PharmaLink UNILAG:</strong> A dedicated, private academic and social network restricted strictly to verified 200L–500L Pharmacy students at the University of Lagos.
          </div>

          {!user ? (
            <AuthModal onAuthSuccess={handleAuthSuccess} />
          ) : (
            <div>
              {/* Verification Section Component (EPIC-003) */}
              <VerificationSection
                user={user}
                token={token}
                onStatusUpdated={handleStatusUpdated}
              />

              {activeView === 'feed' && (
                <div className="card" data-testid="authenticated-dashboard">
                  <h2 className="card-title">Welcome back, {user.fullName}!</h2>
                  <p className="card-subtitle">
                    Academic Level: <strong>{user.level}</strong> &bull; Verification Status:{' '}
                    <span style={{
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: user.verificationStatus === 'verified' ? 'var(--success)' : 'var(--accent)'
                    }}>
                      {user.verificationStatus}
                    </span>
                  </p>

                  <div className="feature-grid">
                    <div className="feature-box">
                      <h4>Student Verification (EPIC-003)</h4>
                      <p>
                        Current status: <strong>{user.verificationStatus.toUpperCase()}</strong>.
                        Submit your UNILAG ID card or signed course form to unlock community discussions and academic vault materials.
                      </p>
                    </div>

                    <div className="feature-box">
                      <h4>Student Authentication (EPIC-002)</h4>
                      <p>Secure JWT session active. Passwords salted with bcrypt. Access token securely scoped to your UNILAG identity.</p>
                    </div>

                    <div className="feature-box">
                      <h4>Materials Vault</h4>
                      <p>Browse past questions, syllabus summaries, and laboratory practical manuals tailored to {user.level}.</p>
                    </div>

                    <div className="feature-box">
                      <h4>PANS Official Notices</h4>
                      <p>Stay informed with faculty announcements and level updates from official representatives.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        PharmaLink UNILAG &copy; {new Date().getFullYear()} Faculty of Pharmacy, University of Lagos. All rights reserved.
      </footer>
    </div>
  );
}
