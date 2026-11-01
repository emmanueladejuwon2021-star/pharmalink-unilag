import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Edit3,
  Search,
  BookOpen,
  Award,
  Layers,
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import {
  getMyProfile,
  updateMyProfile,
  listStudentDirectory
} from '../api/profile';

const DEPARTMENTS = [
  { code: 'CPH', name: 'Clinical Pharmacy and Biopharmacy' },
  { code: 'PCH', name: 'Pharmaceutical Chemistry' },
  { code: 'PCT', name: 'Pharmaceutics and Pharmaceutical Technology' },
  { code: 'PCG', name: 'Pharmacognosy' },
  { code: 'PCL', name: 'Pharmacology, Therapeutics and Toxicology' }
];

const ELIGIBLE_LEVELS = ['200L', '300L', '400L', '500L'];

export default function ProfileSection({ user, token, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('me'); // 'me' | 'directory'
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit form state
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    department: user?.department || '',
    interests: user?.interests ? user.interests.join(', ') : '',
    linkedin: user?.socialLinks?.linkedin || '',
    twitter: user?.socialLinks?.twitter || ''
  });

  // Directory state
  const [directory, setDirectory] = useState([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirLevel, setDirLevel] = useState('all');
  const [dirDept, setDirDept] = useState('all');
  const [dirSearch, setDirSearch] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile(token);
      setProfile(data.user);
      setFormData({
        bio: data.user.bio || '',
        department: data.user.department || '',
        interests: data.user.interests ? data.user.interests.join(', ') : '',
        linkedin: data.user.socialLinks?.linkedin || '',
        twitter: data.user.socialLinks?.twitter || ''
      });
      if (onProfileUpdated) {
        onProfileUpdated(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDirectory = async () => {
    try {
      setDirLoading(true);
      const data = await listStudentDirectory(token, {
        level: dirLevel,
        department: dirDept,
        search: dirSearch
      });
      setDirectory(data.students || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDirLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'directory' && token) {
      loadDirectory();
    }
  }, [activeTab, dirLevel, dirDept, dirSearch, token]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const parsedInterests = formData.interests
        ? formData.interests.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await updateMyProfile(token, {
        bio: formData.bio,
        department: formData.department || null,
        interests: parsedInterests,
        socialLinks: {
          linkedin: formData.linkedin,
          twitter: formData.twitter
        }
      });

      setProfile(res.user);
      setSuccessMsg('Your BD-Pharm student identity profile has been updated!');
      setEditing(false);
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'UN';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="card" data-testid="profile-section">
      {/* Header and Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon size={20} color="var(--primary)" />
            Student Profiles & Identity (EPIC-005)
          </h2>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            Verified pharmacy student identities, academic departments, research interests, and faculty peer directory.
          </p>
        </div>

        <div className="auth-tabs" style={{ marginBottom: 0 }}>
          <button
            onClick={() => setActiveTab('me')}
            className={`auth-tab-btn ${activeTab === 'me' ? 'active' : ''}`}
            data-testid="tab-my-profile"
          >
            My Identity
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`auth-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            data-testid="tab-directory"
          >
            <Users size={14} /> Student Directory
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert-box error" data-testid="profile-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="alert-box" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {/* Tab 1: My Profile */}
      {activeTab === 'me' ? (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {/* Avatar Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                position: 'relative'
              }}
              data-testid="profile-avatar"
            >
              {getInitials(profile?.fullName)}
              {profile?.verificationStatus === 'verified' && (
                <span
                  title="Verified Student"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: '#fff',
                    borderRadius: '50%',
                    display: 'flex'
                  }}
                >
                  <CheckCircle2 size={18} color="var(--success)" fill="#fff" />
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }} data-testid="profile-full-name">
                  {profile?.fullName}
                </h3>
                <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {profile?.level}
                </span>
                <span style={{ fontSize: '11px', background: '#f1f5f9', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>
                  {profile?.role?.replace('_', ' ')}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  background: profile?.verificationStatus === 'verified' ? '#d1fae5' : '#fef3c7',
                  color: profile?.verificationStatus === 'verified' ? '#065f46' : '#92400e'
                }}>
                  {profile?.verificationStatus?.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Matriculation: <strong>{profile?.matricNumber}</strong> &bull; UNILAG Email: {profile?.email}
              </div>

              {profile?.department ? (
                <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                  Department: {profile.department} - {DEPARTMENTS.find(d => d.code === profile.department)?.name || ''}
                </div>
              ) : null}

              {profile?.bio ? (
                <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-main)', lineHeight: 1.4 }} data-testid="profile-bio-text">
                  {profile.bio}
                </p>
              ) : (
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No bio added yet. Tell your faculty peers about your interests.
                </p>
              )}

              {/* Interests Tags */}
              {profile?.interests && profile.interests.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px' }}
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Edit Profile Button */}
            <div>
              <button
                onClick={() => setEditing(!editing)}
                className="submit-button"
                style={{ padding: '6px 12px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                data-testid="edit-profile-btn"
              >
                <Edit3 size={13} />
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Activity / Reputation Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
            <div className="feature-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
                {profile?.stats?.postsCount || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Community Posts</div>
            </div>
            <div className="feature-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--secondary)' }}>
                {profile?.stats?.materialsCount || 0}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Materials Shared</div>
            </div>
            <div className="feature-box" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                {profile?.stats?.reputationPoints || 10}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reputation Points</div>
            </div>
          </div>

          {/* Edit Profile Form */}
          {editing ? (
            <form onSubmit={handleSaveProfile} className="auth-form" style={{ marginTop: '20px', background: '#fff', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }} data-testid="edit-profile-form">
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>Edit Your BD-Pharm Identity</h4>

              <div className="form-group">
                <label>Academic Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  data-testid="profile-dept-select"
                >
                  <option value="">Select Primary Department (Optional)</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Bio (Max 300 characters)</label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  maxLength="300"
                  placeholder="Share your academic interests, pharmacy focus, or career aspirations..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                  data-testid="profile-bio-input"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {formData.bio.length} / 300 characters
                </span>
              </div>

              <div className="form-group">
                <label>Academic & Research Interests (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Pharmacokinetics, Drug Design, Phytotherapy"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  data-testid="profile-interests-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>LinkedIn Profile</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Twitter / X Handle</label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="submit-button" disabled={saving} data-testid="save-profile-btn">
                {saving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        /* Tab 2: Student Directory */
        <div data-testid="student-directory-view">
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setDirLevel('all')}
                className={`auth-tab-btn ${dirLevel === 'all' ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                All Levels
              </button>
              {ELIGIBLE_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDirLevel(lvl)}
                  className={`auth-tab-btn ${dirLevel === lvl ? 'active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  data-testid={`dir-filter-${lvl}`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <select
              value={dirDept}
              onChange={(e) => setDirDept(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
              data-testid="dir-dept-select"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.code}
                </option>
              ))}
            </select>

            <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search peers by name or matric..."
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                style={{ width: '100%', padding: '4px 8px 4px 26px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
                data-testid="dir-search-input"
              />
            </div>
          </div>

          {dirLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Searching student directory...
            </div>
          ) : directory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No pharmacy students found matching the selected filters.
            </div>
          ) : (
            <div className="feature-grid" style={{ marginTop: 0 }} data-testid="directory-grid">
              {directory.map((student) => (
                <div key={student._id} className="feature-box" data-testid={`student-card-${student.matricNumber}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700
                      }}
                    >
                      {getInitials(student.fullName)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13px' }}>{student.fullName}</strong>
                        {student.verificationStatus === 'verified' && (
                          <CheckCircle2 size={13} color="var(--success)" />
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {student.level} &bull; Matric: {student.matricNumber}
                      </div>
                    </div>
                  </div>

                  {student.department ? (
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '6px' }}>
                      {student.department}
                    </div>
                  ) : null}

                  {student.bio ? (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                      {student.bio}
                    </p>
                  ) : null}

                  {student.interests && student.interests.length > 0 ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {student.interests.slice(0, 3).map((item, idx) => (
                        <span key={idx} style={{ fontSize: '10px', background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>
                          #{item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
