import React, { useState } from 'react';
import { UserPlus, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    matricNumber: '',
    level: '200L',
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            matricNumber: formData.matricNumber,
            level: formData.level,
            password: formData.password
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        onAuthSuccess(data.token, data.user);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: formData.identifier,
            password: formData.password
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        onAuthSuccess(data.token, data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card" data-testid="auth-component">
      <div className="auth-header">
        <h3 className="auth-title">
          {mode === 'login' ? 'Student Sign In' : 'Create Student Account'}
        </h3>
        <p className="auth-subtitle">
          Faculty of Pharmacy, University of Lagos (200L–500L)
        </p>
      </div>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
          onClick={() => { setMode('login'); setError(null); }}
          data-testid="tab-login"
        >
          <LogIn size={15} /> Sign In
        </button>
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
          onClick={() => { setMode('register'); setError(null); }}
          data-testid="tab-register"
        >
          <UserPlus size={15} /> Register
        </button>
      </div>

      {error && (
        <div className="alert-box error" data-testid="auth-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" data-testid="auth-form">
        {mode === 'register' ? (
          <>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="e.g. Babatunde Adeyemi"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">UNILAG Student Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="student@live.unilag.edu.ng"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="matricNumber">Matric Number (9 digits)</label>
                <input
                  id="matricNumber"
                  name="matricNumber"
                  type="text"
                  placeholder="190805001"
                  maxLength={9}
                  value={formData.matricNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="level">Academic Level</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="200L">200L</option>
                  <option value="300L">300L</option>
                  <option value="400L">400L</option>
                  <option value="500L">500L</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password (min 8 chars)</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                placeholder="••••••••"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="identifier">UNILAG Email or Matric Number</label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="student@live.unilag.edu.ng or 190805001"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
          data-testid="auth-submit-btn"
        >
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {/* GitHub Pages 1-Click UI Preview Bar */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Sparkles size={14} color="var(--accent)" />
          <strong>Testing UI on GitHub Pages?</strong> Instant demo profiles:
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="submit-button"
            style={{ flex: 1, minWidth: '140px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0.55rem 0.6rem' }}
            onClick={() => onAuthSuccess('demo-student-token', {
              _id: 'demo-student-01',
              fullName: 'Chidi Okafor (Demo Student)',
              email: 'chidi.okafor@live.unilag.edu.ng',
              matricNumber: '190805501',
              level: '400L',
              department: 'PCL',
              role: 'student',
              verificationStatus: 'verified'
            })}
            data-testid="demo-student-btn"
          >
            Explore as 400L Student
          </button>
          <button
            type="button"
            className="submit-button"
            style={{ flex: 1, minWidth: '140px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0.55rem 0.6rem' }}
            onClick={() => onAuthSuccess('demo-admin-token', {
              _id: 'demo-admin-01',
              fullName: 'PANS Executive (Demo Admin)',
              email: 'pans.exec@live.unilag.edu.ng',
              matricNumber: '180805599',
              level: '500L',
              department: 'CPH',
              role: 'admin',
              verificationStatus: 'verified'
            })}
            data-testid="demo-admin-btn"
          >
            Explore as PANS Admin
          </button>
        </div>
      </div>
    </div>
  );
}
