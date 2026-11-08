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
  CheckCircle2,
  Search,
  ShieldAlert
} from 'lucide-react';
import AuthModal from './components/AuthModal';
import VerificationSection from './components/VerificationSection';
import AcademicSection from './components/AcademicSection';
import ProfileSection from './components/ProfileSection';
import FeedSection from './components/FeedSection';
import MaterialsSection from './components/MaterialsSection';
import AnnouncementsSection from './components/AnnouncementsSection';
import AdminConsole from './components/AdminConsole';
import SearchModal from './components/SearchModal';
import NotificationsModal from './components/NotificationsModal';
import { fetchUnreadCount } from './api/notifications';
import './App.css';

export default function App() {
  const [health, setHealth] = useState({
    loading: true,
    status: 'checking',
    data: null,
    error: null
  });

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pharmalink_token') || null);
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'verification' | 'levels' | 'profile' | 'vault' | 'pans' | 'admin'

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json ? res.json() : {};
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
        // Load initial unread notifications count
        fetchUnreadCount({ token })
          .then((nd) => setUnreadNotifCount(nd.unreadCount || 0))
          .catch(() => {});
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

  const isStaff = user && (user.role === 'admin' || user.role === 'moderator');

  return (
    <div className="app-container" data-testid="pharmalink-app">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-badge">PANS</div>
          <div className="brand-title">
            BD-Pharm
            <span className="tagline">| UNILAG Pharmacy Network</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              {/* Global Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                data-testid="header-search-btn"
                className="action-btn"
                title="Search (Posts, Vault, Students)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--surface-raised, rgba(255,255,255,0.06))',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Search size={14} />
                <span className="search-hint">Search BD-Pharm</span>
              </button>

              {/* Notifications Button */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                data-testid="header-notifications-btn"
                className="action-btn"
                title="Notifications"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <Bell size={16} />
                {unreadNotifCount > 0 && (
                  <span
                    data-testid="unread-badge"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--danger, #ef4444)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '999px',
                      padding: '1px 5px'
                    }}
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* User Session Badge */}
              <div
                className="user-badge"
                data-testid="user-session-badge"
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveView('profile')}
                title="Click to view Profile & Student Directory"
              >
                <UserIcon size={14} />
                <span>
                  <strong>{user.fullName}</strong> ({user.level})
                </span>
                {user.verificationStatus === 'verified' && (
                  <span
                    title="Verified Pharmacy Student"
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                  >
                    <CheckCircle2 size={13} color="var(--success)" />
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="logout-btn"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </>
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
            onClick={(e) => {
              e.preventDefault();
              setActiveView('feed');
            }}
            data-testid="nav-feed"
          >
            <Compass />
            <span>Social Feed</span>
          </a>
          <a
            href="#verification"
            className={`nav-link ${activeView === 'verification' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView('verification');
            }}
            data-testid="nav-verification"
          >
            <ShieldCheck />
            <span>Student Verification</span>
          </a>
          <a
            href="#levels"
            className={`nav-link ${activeView === 'levels' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView('levels');
            }}
            data-testid="nav-levels"
          >
            <GraduationCap />
            <span>Levels & Courses</span>
          </a>
          <a
            href="#profile"
            className={`nav-link ${activeView === 'profile' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView('profile');
            }}
            data-testid="nav-profile"
          >
            <UserIcon />
            <span>Student Profile</span>
          </a>
          <a
            href="#vault"
            className={`nav-link ${activeView === 'vault' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView('vault');
            }}
            data-testid="nav-vault"
          >
            <BookOpen />
            <span>Materials Vault</span>
          </a>
          <a
            href="#pans"
            className={`nav-link ${activeView === 'pans' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveView('pans');
            }}
            data-testid="nav-pans"
          >
            <Bell />
            <span>PANS Official</span>
          </a>
          {isStaff && (
            <a
              href="#admin"
              className={`nav-link ${activeView === 'admin' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveView('admin');
              }}
              data-testid="nav-admin"
              style={{ color: 'var(--accent, #eab308)' }}
            >
              <ShieldAlert />
              <span>Admin Console</span>
            </a>
          )}
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
            <strong>Welcome to BD-Pharm:</strong> A dedicated, private academic and social network
            restricted strictly to verified 200L–500L Pharmacy students at the University of Lagos.
          </div>

          {!user ? (
            <AuthModal onAuthSuccess={handleAuthSuccess} />
          ) : (
            <div>
              {/* Verification Section */}
              {activeView === 'verification' && (
                <VerificationSection
                  user={user}
                  token={token}
                  onStatusUpdated={handleStatusUpdated}
                />
              )}

              {/* Academic Structure Section (EPIC-004) */}
              {activeView === 'levels' && <AcademicSection user={user} token={token} />}

              {/* User Profile & Student Directory (EPIC-005) */}
              {activeView === 'profile' && (
                <ProfileSection
                  user={user}
                  token={token}
                  onProfileUpdated={(updatedUser) => setUser(updatedUser)}
                />
              )}

              {/* Materials Vault Section (EPIC-011 & EPIC-012) */}
              {activeView === 'vault' && <MaterialsSection user={user} token={token} />}

              {/* Official PANS Announcements Section (EPIC-015) */}
              {activeView === 'pans' && <AnnouncementsSection user={user} token={token} />}

              {/* Admin Console & Verification Queue (EPIC-016 & EPIC-017) */}
              {activeView === 'admin' && isStaff && <AdminConsole token={token} currentUser={user} />}

              {/* Feed & Default Dashboard View (EPIC-006 & EPIC-007) */}
              {activeView === 'feed' && (
                <div>
                  <FeedSection user={user} token={token} />

                  <VerificationSection
                    user={user}
                    token={token}
                    onStatusUpdated={handleStatusUpdated}
                  />

                  <AcademicSection user={user} token={token} />

                  <div className="card" data-testid="authenticated-dashboard">
                    <h2 className="card-title">Welcome back, {user.fullName}!</h2>
                    <p className="card-subtitle">
                      Academic Level: <strong>{user.level}</strong> &bull; Verification Status:{' '}
                      <span
                        style={{
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          color: user.verificationStatus === 'verified' ? 'var(--success)' : 'var(--accent)'
                        }}
                      >
                        {user.verificationStatus}
                      </span>
                    </p>

                    <div className="feature-grid">
                      <div className="feature-box">
                        <h4>PANS Announcements (EPIC-015)</h4>
                        <p>
                          Stay informed with official faculty news, election circulars, and level representative updates.
                        </p>
                      </div>

                      <div className="feature-box">
                        <h4>Global Search & Discovery (EPIC-013)</h4>
                        <p>
                          Instantly find lecture notes, past questions, and fellow pharmacy students across 200L to 500L.
                        </p>
                      </div>

                      <div className="feature-box">
                        <h4>Materials Vault (EPIC-011 & 012)</h4>
                        <p>
                          Access verified pharmacy lecture notes, past questions, lab resources, and summary sheets.
                        </p>
                      </div>

                      <div className="feature-box">
                        <h4>Student Verification (EPIC-003)</h4>
                        <p>
                          Current status: <strong>{user.verificationStatus.toUpperCase()}</strong>.
                          Submit your UNILAG ID card or signed course form for community privileges.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Global Search Modal (EPIC-013) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        token={token}
        user={user}
        onSelectPost={() => setActiveView('feed')}
        onSelectMaterial={() => setActiveView('vault')}
        onSelectStudent={() => setActiveView('profile')}
      />

      {/* Notifications Modal (EPIC-014) */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        token={token}
        onNotificationCountChange={(cnt) => setUnreadNotifCount(cnt)}
      />

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <nav className="mobile-nav" data-testid="mobile-nav">
          <button
            onClick={() => setActiveView('feed')}
            className={`mobile-nav-link ${activeView === 'feed' ? 'active' : ''}`}
            data-testid="mobile-nav-feed"
          >
            <Compass />
            <span>Feed</span>
          </button>
          <button
            onClick={() => setActiveView('vault')}
            className={`mobile-nav-link ${activeView === 'vault' ? 'active' : ''}`}
            data-testid="mobile-nav-vault"
          >
            <BookOpen />
            <span>Vault</span>
          </button>
          <button
            onClick={() => setActiveView('pans')}
            className={`mobile-nav-link ${activeView === 'pans' ? 'active' : ''}`}
            data-testid="mobile-nav-pans"
          >
            <Bell />
            <span>PANS</span>
          </button>
          <button
            onClick={() => setActiveView('profile')}
            className={`mobile-nav-link ${activeView === 'profile' ? 'active' : ''}`}
            data-testid="mobile-nav-profile"
          >
            <UserIcon />
            <span>Profile</span>
          </button>
          {isStaff && (
            <button
              onClick={() => setActiveView('admin')}
              className={`mobile-nav-link ${activeView === 'admin' ? 'active' : ''}`}
              data-testid="mobile-nav-admin"
              style={{ color: activeView === 'admin' ? 'var(--primary)' : 'var(--accent, #eab308)' }}
            >
              <ShieldAlert />
              <span>Admin</span>
            </button>
          )}
        </nav>
      )}

      {/* Footer */}
      <footer className="app-footer">
        BD-Pharm &copy; {new Date().getFullYear()} Faculty of Pharmacy, University of Lagos. All rights reserved.
      </footer>
    </div>
  );
}
