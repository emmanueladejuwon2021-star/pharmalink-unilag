import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Bell,
  Compass,
  HelpCircle,
  Layers,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState({
    loading: true,
    status: 'checking',
    data: null,
    error: null
  });

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

        <div>
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
          <a href="#feed" className="nav-link active">
            <Compass />
            <span>Social Feed</span>
          </a>
          <a href="#vault" className="nav-link">
            <BookOpen />
            <span>Materials Vault</span>
          </a>
          <a href="#levels" className="nav-link">
            <GraduationCap />
            <span>Levels (200L–500L)</span>
          </a>
          <a href="#verification" className="nav-link">
            <ShieldCheck />
            <span>Student Verification</span>
          </a>
          <a href="#pans" className="nav-link">
            <Bell />
            <span>PANS Official</span>
          </a>
          <a href="#quizzes" className="nav-link">
            <Layers />
            <span>Daily Dose Quizzes</span>
          </a>
          <a href="#support" className="nav-link">
            <HelpCircle />
            <span>Help & Guidelines</span>
          </a>
        </aside>

        {/* Content */}
        <main className="main-content">
          <div className="notice-box">
            <strong>Welcome to PharmaLink UNILAG:</strong> A dedicated, private academic and social network restricted strictly to verified 200L–500L Pharmacy students at the University of Lagos.
          </div>

          <div className="card">
            <h2 className="card-title">Project Foundation & Architecture (EPIC-001)</h2>
            <p className="card-subtitle">
              Unified MERN stack workspace initialized with robust error handling, responsive UI shell, shared domain contracts, and end-to-end test infrastructure.
            </p>

            <div className="feature-grid">
              <div className="feature-box">
                <h4>Verified Faculty Boundary</h4>
                <p>Restricted to UNILAG Pharmacy students (200L to 500L). No anonymous questions, direct messages, or external visitors.</p>
              </div>

              <div className="feature-box">
                <h4>System Health & Backend</h4>
                <p>
                  API Status: <strong>{health.status.toUpperCase()}</strong>
                  <br />
                  {health.data ? `Uptime: ${health.data.uptimeSeconds}s | App: ${health.data.appName}` : 'Backend service ready.'}
                </p>
              </div>

              <div className="feature-box">
                <h4>Materials Vault Architecture</h4>
                <p>Standardized document tagging for past questions, lecture notes, lab manuals, and exam study guides across professional years.</p>
              </div>

              <div className="feature-box">
                <h4>PANS Official Channel</h4>
                <p>Authentic level rep and executive announcements with verifiable provenance and academic session tracking.</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        PharmaLink UNILAG &copy; {new Date().getFullYear()} Faculty of Pharmacy, University of Lagos. All rights reserved.
      </footer>
    </div>
  );
}
