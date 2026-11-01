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
  UserCircle2
} from 'lucide-react';
import AuthModal from './components/AuthModal';
import VerificationPanel from './components/VerificationPanel';
import AdminVerificationList from './components/AdminVerificationList';
import AcademicHub from './components/AcademicHub';
import ProfileHub from './components/ProfileHub';
import SocialFeed from './components/SocialFeed';

export default function App() {
  const [health, setHealth] = useState({
    loading: true,
    status: 'checking',
    data: null,
    error: null
  });

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pharmalink_token') || null);
  const [activeTab, setActiveTab] = useState('feed');

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
              <button onClick={handleLogout} className="logout-btn" title="Sign Out">
                <LogOut size={13} />
              </button>
            </div>
          ) : null}

          {health.status === 'online' ? (
            <span className="status-pill online" data-testid="api-status-online">
              <span className="indicator-dot"></span>
              PharmaLink Connected
            </span>
          ) : (
            <span className="status-pill offline" data-testid="api-status-offline">
              <span className="indicator-dot"></span>
              {health.loading ? 'Connecting...' : 'Connecting to Server'}
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
            className={`nav-link ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
            data-testid="nav-feed"
          >
            <Compass />
            <span>Social Feed</span>
          </a>
          <a
            href="#vault"
            className={`nav-link ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
            data-testid="nav-vault"
          >
            <BookOpen />
            <span>Materials Vault</span>
          </a>
          <a
            href="#academic"
            className={`nav-link ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
            data-testid="nav-academic"
          >
            <GraduationCap />
            <span>Academic Hub</span>
          </a>
          <a
            href="#profile"
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            data-testid="nav-profile"
          >
            <UserCircle2 />
            <span>My Profile</span>
          </a>
          <a
            href="#verification"
            className={`nav-link ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
            data-testid="nav-verification"
          >
            <ShieldCheck />
            <span>Student Verification</span>
          </a>
          <a
            href="#pans"
            className={`nav-link ${activeTab === 'pans' ? 'active' : ''}`}
            onClick={() => setActiveTab('pans')}
            data-testid="nav-pans"
          >
            <Bell />
            <span>PANS Official</span>
          </a>
          <a
            href="#quizzes"
            className={`nav-link ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
            data-testid="nav-quizzes"
          >
            <Layers />
            <span>Daily Dose Quizzes</span>
          </a>
          <a
            href="#support"
            className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
            data-testid="nav-support"
          >
            <HelpCircle />
            <span>Help & Guidelines</span>
          </a>
        </aside>

        {/* Content */}
        <main className="main-content">
          <div className="notice-box">
            <strong>Welcome to PharmaLink UNILAG:</strong> A private, trusted community created exclusively for University of Lagos Faculty of Pharmacy students (200L to 500L).
          </div>

          {!user ? (
            <AuthModal onAuthSuccess={handleAuthSuccess} />
          ) : (
            <>
              {activeTab === 'verification' ? (
                <>
                  <VerificationPanel
                    user={user}
                    token={token}
                    onStatusUpdated={(newStatus) => {
                      setUser((prev) => ({ ...prev, verificationStatus: newStatus }));
                    }}
                  />
                  {/* Admin review tool */}
                  <AdminVerificationList
                    token={token}
                    onReviewCompleted={(res) => {
                      if (res.student && res.student.email === user.email) {
                        setUser((prev) => ({ ...prev, verificationStatus: res.student.verificationStatus }));
                      }
                    }}
                  />
                </>
              ) : activeTab === 'profile' ? (
                <ProfileHub
                  user={user}
                  token={token}
                  onProfileUpdated={(profile) => {
                    setUser((prev) => ({ ...prev, bio: profile.bio, interests: profile.interests }));
                  }}
                />
              ) : activeTab === 'academic' ? (
                <AcademicHub
                  user={user}
                  token={token}
                  onLevelUpdated={(student) => {
                    setUser((prev) => ({ ...prev, level: student.level }));
                  }}
                />
              ) : activeTab === 'feed' ? (
                <SocialFeed user={user} token={token} />
              ) : (
                <div className="card" data-testid="authenticated-dashboard">
                  <h2 className="card-title">Welcome back, {user.fullName}!</h2>
                  <p className="card-subtitle">
                    Class Level: <strong>{user.level}</strong> &bull; Verification Status:{' '}
                    <span style={{
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: user.verificationStatus === 'verified' ? 'var(--success)' : 'var(--accent)'
                    }}>
                      {user.verificationStatus === 'verified' ? 'Verified Member' : user.verificationStatus === 'pending' ? 'Review in Progress' : 'Awaiting Document Upload'}
                    </span>
                  </p>

                  <div className="feature-grid">
                    <div className="feature-box">
                      <h4>Verified Student Space</h4>
                      <p>Your student account is linked to your UNILAG identity ({user.email}). No anonymous posts or outside visitors are allowed.</p>
                    </div>

                    <div className="feature-box">
                      <h4>Faculty Verification Status</h4>
                      <p>
                        {user.verificationStatus === 'verified'
                          ? 'You have complete student privileges across all features.'
                          : 'Please confirm your student status by uploading your ID card or course registration form.'}
                      </p>
                      {user.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => setActiveTab('verification')}
                          className="submit-button"
                          style={{ padding: '4px 10px', fontSize: '11px', marginTop: '6px' }}
                          data-testid="go-to-verify-btn"
                        >
                          Verify Now
                        </button>
                      )}
                    </div>

                    <div className="feature-box">
                      <h4>Materials Vault</h4>
                      <p>Access notes, past exam questions, and laboratory manuals shared for {user.level} pharmacy courses.</p>
                    </div>

                    <div className="feature-box">
                      <h4>PANS Executive Desk</h4>
                      <p>Read official announcements directly from your class representatives and PANS student leaders.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
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
