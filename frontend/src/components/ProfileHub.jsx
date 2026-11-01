import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Lock
} from 'lucide-react';
import { getMyProfile, updateMyProfile, listProfiles } from '../api/profiles';

const INTEREST_AREAS = [
  'Pharmacology',
  'Pharmaceutical Chemistry',
  'Pharmaceutics & Formulation',
  'Clinical Pharmacy & Therapeutics',
  'Pharmacognosy',
  'Hospital & Community Pharmacy',
  'Pharmaceutical Microbiology',
  'Research & Publications',
  'Exam Prep & Past Questions',
  'Student Welfare & Mentorship'
];

const LEVEL_OPTIONS = ['200L', '300L', '400L', '500L'];
const BIO_MAX = 300;

// Deterministic initials avatar (same logic as shared/getInitials)
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({ name, size = 34 }) {
  const palette = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#4f46e5'];
  let hash = 0;
  const seed = name || '?';
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return (
    <span
      className="profile-avatar"
      data-testid="profile-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: palette[hash % palette.length],
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0
      }}
    >
      {initials(name)}
    </span>
  );
}

export default function ProfileHub({ user, token, onProfileUpdated }) {
  const [view, setView] = useState('me'); // 'me' | 'directory'
  const [myProfile, setMyProfile] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit form state
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [graduatingYear, setGraduatingYear] = useState('');
  const [visibility, setVisibility] = useState('verified-only');

  // Directory state
  const [members, setMembers] = useState([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isVerified = user.verificationStatus === 'verified';

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile(token);
      setMyProfile(data.profile);
      setAcademic(data.academic);
      setBio(data.profile.bio || '');
      setInterests(data.profile.interests || []);
      setGraduatingYear(data.profile.graduatingYear ? String(data.profile.graduatingYear) : '');
      setVisibility(data.profile.profileVisibility || 'verified-only');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadDirectory = useCallback(async () => {
    setDirLoading(true);
    setError(null);
    try {
      const data = await listProfiles(token, {
        level: levelFilter || undefined,
        search: searchTerm || undefined
      });
      setMembers(data.profiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setDirLoading(false);
    }
  }, [token, levelFilter, searchTerm]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    if (view === 'directory' && isVerified) {
      loadDirectory();
    }
  }, [view, isVerified, loadDirectory]);

  const toggleInterest = (area) => {
    setInterests((prev) =>
      prev.includes(area) ? prev.filter((i) => i !== area) : [...prev, area]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (bio.length > BIO_MAX) {
      setError(`Bio must be ${BIO_MAX} characters or fewer.`);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await updateMyProfile(token, {
        bio,
        interests,
        graduatingYear: graduatingYear ? Number(graduatingYear) : null,
        profileVisibility: visibility
      });
      setMyProfile(data.profile);
      setSuccessMsg('Your profile has been saved.');
      if (onProfileUpdated) onProfileUpdated(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const completeness = myProfile?.completeness ?? 0;

  return (
    <div className="card" data-testid="profile-hub">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <UserCircle2 color="var(--primary)" size={22} />
        <h3 className="card-title" style={{ margin: 0 }}>My Profile & Members</h3>
      </div>
      <p className="card-subtitle">
        Manage your UNILAG Pharmacy identity and discover verified classmates across levels.
      </p>

      {/* View tabs */}
      <div className="pill-tabs" role="tablist" style={{ display: 'flex', gap: '6px', margin: '10px 0' }}>
        <button
          role="tab"
          aria-selected={view === 'me'}
          className={`pill-tab ${view === 'me' ? 'active' : ''}`}
          onClick={() => setView('me')}
          data-testid="profile-tab-me"
        >
          My Profile
        </button>
        <button
          role="tab"
          aria-selected={view === 'directory'}
          className={`pill-tab ${view === 'directory' ? 'active' : ''}`}
          onClick={() => setView('directory')}
          disabled={!isVerified}
          title={isVerified ? 'Browse verified members' : 'Verification required to browse member profiles'}
          data-testid="profile-tab-directory"
        >
          {!isVerified && <Lock size={12} style={{ verticalAlign: 'middle' }} />} Member Directory
        </button>
      </div>

      {error && (
        <div className="alert-box error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert-box success" data-testid="profile-success-alert">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {view === 'me' && (
        loading ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <Loader2 size={14} className="spin" /> Loading your profile...
          </p>
        ) : myProfile && (
          <div data-testid="my-profile-section">
            {/* Identity header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Avatar name={myProfile.fullName} size={44} />
              <div>
                <strong>{myProfile.fullName}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {myProfile.level} • {academic ? `${academic.session}, ${academic.semester}` : 'Session not set'}
                </div>
                <div style={{ fontSize: '11px' }}>
                  {isVerified ? (
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                      <ShieldCheck size={12} style={{ verticalAlign: 'middle' }} /> Verified Member
                    </span>
                  ) : (
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Verification pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* Completeness meter */}
            <div data-testid="profile-completeness" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                <span>Profile completeness</span>
                <strong>{completeness}%</strong>
              </div>
              <div
                role="progressbar"
                aria-valuenow={completeness}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  height: 6,
                  borderRadius: 4,
                  background: 'var(--border, #e5e7eb)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ width: `${completeness}%`, height: '100%', background: 'var(--primary)' }} />
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSave} data-testid="profile-edit-form">
              <div className="form-group">
                <label htmlFor="profileBio">Short bio ({bio.length}/{BIO_MAX})</label>
                <textarea
                  id="profileBio"
                  value={bio}
                  maxLength={BIO_MAX}
                  rows={3}
                  placeholder="e.g. Clinical pharmacy enthusiast, PGDA member, love explaining pharmacokinetics."
                  onChange={(e) => setBio(e.target.value)}
                  data-testid="profile-bio-input"
                />
              </div>

              <fieldset style={{ border: 'none', padding: 0, margin: '0 0 10px' }} data-testid="interest-fieldset">
                <legend style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Academic interests</legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {INTEREST_AREAS.map((area) => (
                    <label key={area} className={`chip-select ${interests.includes(area) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={interests.includes(area)}
                        onChange={() => toggleInterest(area)}
                        style={{ display: 'none' }}
                      />
                      {area}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                  <label htmlFor="gradYear">Expected graduation year</label>
                  <input
                    id="gradYear"
                    type="number"
                    min="2025"
                    max="2035"
                    value={graduatingYear}
                    onChange={(e) => setGraduatingYear(e.target.value)}
                    placeholder="e.g. 2028"
                    data-testid="grad-year-input"
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 160px' }}>
                  <label htmlFor="visibilitySelect">Profile visibility</label>
                  <select
                    id="visibilitySelect"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    data-testid="visibility-select"
                  >
                    <option value="verified-only">Verified members only</option>
                    <option value="public">Public within faculty</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={saving} data-testid="save-profile-btn">
                {saving ? 'Saving...' : 'Save My Profile'}
              </button>
            </form>
          </div>
        )
      )}

      {view === 'directory' && (
        !isVerified ? (
          <p data-testid="directory-locked-note" style={{ fontSize: '12px' }}>
            The member directory is restricted to verified UNILAG Pharmacy students.
            Complete your verification in the Student Verification tab to unlock it.
          </p>
        ) : dirLoading ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <Loader2 size={14} className="spin" /> Loading members...
          </p>
        ) : (
          <div data-testid="member-directory">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div className="form-group" style={{ flex: '0 0 120px', margin: 0 }}>
                <select
                  aria-label="Filter by level"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  data-testid="directory-level-filter"
                >
                  <option value="">All levels</option>
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: '1 1 160px', margin: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
                  <input
                    aria-label="Search members by name"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: 26 }}
                    data-testid="directory-search-input"
                  />
                </div>
              </div>
            </div>

            {members.length === 0 ? (
              <p data-testid="directory-empty" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                No classmates match this filter yet.
              </p>
            ) : (
              <ul className="member-list" style={{ listStyle: 'none', margin: 0, padding: 0 }} data-testid="member-list">
                {members.map((m) => (
                  <li key={m._id} className="member-row" style={{
                    display: 'flex', gap: '10px', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--border, #eee)'
                  }}>
                    <Avatar name={m.fullName} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: '13px' }}>{m.fullName}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {m.level}
                        {m.verificationStatus === 'verified' && (
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}> • Verified</span>
                        )}
                        {m.graduatingYear ? ` • Graduates ${m.graduatingYear}` : ''}
                      </div>
                      {m.bio && (
                        <div style={{ fontSize: '11px', marginTop: '2px' }}>{m.bio}</div>
                      )}
                      {m.interests?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                          {m.interests.map((i) => (
                            <span key={i} className="chip-tag" style={{
                              fontSize: '10px', padding: '1px 6px', borderRadius: 8,
                              background: 'rgba(37,99,235,0.08)', color: 'var(--primary)'
                            }}>{i}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <Users size={12} style={{ verticalAlign: 'middle' }} /> Showing {members.length} member{members.length === 1 ? '' : 's'}.
            </p>
          </div>
        )
      )}
    </div>
  );
}
