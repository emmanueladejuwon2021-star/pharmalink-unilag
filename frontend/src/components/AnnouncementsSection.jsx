import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  AlertTriangle,
  Calendar,
  Plus,
  X,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  fetchAnnouncements,
  createAnnouncement,
  togglePinAnnouncement
} from '../api/announcements';
import { FALLBACK_ANNOUNCEMENTS } from '../data/mockFallbackData';

const CATEGORIES = [
  'All',
  'General',
  'Academic',
  'Elections',
  'Events',
  'Dues & Welfare',
  'Emergency'
];

export default function AnnouncementsSection({ user, token }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('normal');
  const [targetLevel, setTargetLevel] = useState('All Levels');

  const isVerified = user?.verificationStatus === 'verified';
  const isAuthorizedPublisher =
    user?.role === 'pans_exec' || user?.role === 'level_rep' || user?.role === 'admin';

  useEffect(() => {
    loadAnnouncements();
  }, [selectedCategory]);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      setError('');
      if (token?.startsWith('demo-') || !token) {
        let list = [...FALLBACK_ANNOUNCEMENTS];
        if (selectedCategory !== 'All') {
          list = list.filter((a) => a.category === selectedCategory);
        }
        setAnnouncements(list);
        return;
      }
      const filters = {};
      if (selectedCategory !== 'All') filters.category = selectedCategory;
      const data = await fetchAnnouncements({ ...filters, token });
      setAnnouncements(data.announcements || []);
    } catch (err) {
      // In offline / static build fallback
      let list = [...FALLBACK_ANNOUNCEMENTS];
      if (selectedCategory !== 'All') {
        list = list.filter((a) => a.category === selectedCategory);
      }
      setAnnouncements(list);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      if (token?.startsWith('demo-') || !token) {
        const newAnn = {
          _id: 'ann-demo-' + Date.now(),
          title: title.trim(),
          content: content.trim(),
          category,
          priority,
          targetLevels: [targetLevel],
          isPinned: false,
          author: { fullName: user?.fullName || 'PANS Admin', role: user?.role || 'admin' },
          officialRole: user?.role === 'pans_exec' ? 'PANS Executive' : 'Administrator',
          createdAt: new Date().toISOString()
        };
        FALLBACK_ANNOUNCEMENTS.unshift(newAnn);
        setAnnouncements((prev) => [newAnn, ...prev]);
        setShowCreateModal(false);
        setTitle('');
        setContent('');
        setCategory('General');
        setPriority('normal');
        setTargetLevel('All Levels');
        setSuccessMsg('Announcement published successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        return;
      }
      await createAnnouncement(
        {
          title: title.trim(),
          content: content.trim(),
          category,
          priority,
          targetLevels: [targetLevel]
        },
        { token }
      );
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      setCategory('General');
      setPriority('normal');
      setTargetLevel('All Levels');
      setSuccessMsg('Announcement published successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadAnnouncements();
    } catch (err) {
      const newAnn = {
        _id: 'ann-demo-' + Date.now(),
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        targetLevels: [targetLevel],
        isPinned: false,
        author: { fullName: user?.fullName || 'PANS Admin', role: user?.role || 'admin' },
        officialRole: user?.role === 'pans_exec' ? 'PANS Executive' : 'Administrator',
        createdAt: new Date().toISOString()
      };
      FALLBACK_ANNOUNCEMENTS.unshift(newAnn);
      setAnnouncements((prev) => [newAnn, ...prev]);
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      setCategory('General');
      setPriority('normal');
      setTargetLevel('All Levels');
      setSuccessMsg('Announcement published successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePin(id) {
    try {
      if (token?.startsWith('demo-') || !token) {
        setAnnouncements((prev) =>
          prev.map((a) => (a._id === id ? { ...a, isPinned: !a.isPinned } : a))
        );
        const found = FALLBACK_ANNOUNCEMENTS.find((a) => a._id === id);
        if (found) found.isPinned = !found.isPinned;
        return;
      }
      await togglePinAnnouncement(id, { token });
      loadAnnouncements();
    } catch (err) {
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isPinned: !a.isPinned } : a))
      );
      const found = FALLBACK_ANNOUNCEMENTS.find((a) => a._id === id);
      if (found) found.isPinned = !found.isPinned;
    }
  }

  return (
    <div className="space-y-4" data-testid="announcements-section">
      {/* Top Banner */}
      <div className="pans-banner" data-testid="pans-announcements-banner">
        <div>
          <div className="pans-banner-title">
            <Megaphone size={20} color="#fde047" />
            <span>Official PANS Announcements</span>
          </div>
          <p className="pans-banner-sub">
            Authoritative faculty updates, executive communiqués, and official level notices.
          </p>
        </div>
        {isAuthorizedPublisher && (
          <button
            onClick={() => setShowCreateModal(true)}
            data-testid="create-announcement-btn"
            className="btn-publish-notice"
          >
            <Plus size={15} /> Publish Notice
          </button>
        )}
      </div>

      {/* Unverified student prompt */}
      {!isVerified && (
        <div
          className="barrier-card"
          data-testid="unverified-announcements-notice"
        >
          <div className="barrier-header">
            <ShieldCheck size={16} />
            <span>Student Verification Notice</span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.4 }}>
            Your account is currently <strong>{user?.verificationStatus?.toUpperCase() || 'UNVERIFIED'}</strong>. You can view faculty-wide public circulars, but must complete Student Verification to receive targeted level circulars, vote in elections, or hold executive rep privileges.
          </p>
        </div>
      )}

      {/* Success banner */}
      {successMsg && (
        <div
          className="alert-box"
          style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
          data-testid="announcements-success"
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="category-pills-bar" data-testid="announcements-categories-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            data-testid={`announcement-category-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert-box error" data-testid="announcements-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Announcements Stream */}
      {loading ? (
        <div
          style={{ textAlign: 'center', padding: '40px 0', fontSize: '12px', color: 'var(--text-muted)' }}
          data-testid="announcements-loading"
        >
          <Loader2
            size={20}
            className="animate-spin"
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }}
          />
          Loading official notices...
        </div>
      ) : announcements.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}
          data-testid="announcements-empty"
        >
          <Megaphone size={28} color="#cbd5e1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
          No official announcements found in this category.
        </div>
      ) : (
        <div>
          {announcements.map((item) => (
            <div
              key={item._id}
              className={`announcement-card ${item.isPinned ? 'pinned' : ''}`}
              data-testid={`announcement-card-${item._id}`}
            >
              <div className="announcement-badges-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {item.isPinned && (
                    <span className="badge-pinned" data-testid={`pinned-badge-${item._id}`}>
                      <Pin size={11} /> PINNED
                    </span>
                  )}
                  {item.priority === 'urgent' && (
                    <span className="badge-priority-urgent">URGENT</span>
                  )}
                  {item.priority === 'critical' && (
                    <span className="badge-priority-critical">CRITICAL</span>
                  )}
                  <span className="badge-category-pans">{item.category}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Target: {item.targetLevels?.join(', ') || 'All Levels'}
                  </span>
                </div>

                {isAuthorizedPublisher && (
                  <button
                    onClick={() => handleTogglePin(item._id)}
                    className="btn-icon-close"
                    title={item.isPinned ? 'Unpin notice' : 'Pin notice'}
                    data-testid={`pin-announcement-btn-${item._id}`}
                  >
                    <Pin
                      size={14}
                      color={item.isPinned ? '#ca8a04' : 'var(--text-muted)'}
                      fill={item.isPinned ? '#ca8a04' : 'none'}
                    />
                  </button>
                )}
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
                {item.content}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span>
                  By: <strong>{item.author?.fullName || 'PANS Executive'}</strong> ({item.officialRole || 'Official'})
                </span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="modal-container" data-testid="create-announcement-modal">
            <div className="modal-header">
              <div className="modal-title">
                <Megaphone size={16} color="var(--primary, #047857)" />
                <span>Publish Official Announcement</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-icon-close"
                data-testid="close-announcement-modal-btn"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Notice Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Faculty General Meeting"
                  data-testid="announcement-title-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    data-testid="announcement-category-select"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    data-testid="announcement-priority-select"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Target Audience</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    data-testid="announcement-target-select"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="200L">200L Only</option>
                    <option value="300L">300L Only</option>
                    <option value="400L">400L Only</option>
                    <option value="500L">500L Only</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Announcement Content</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full text of the circular, resolution, or official announcement..."
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    resize: 'vertical'
                  }}
                  data-testid="announcement-content-input"
                />
              </div>

              <div className="modal-footer" style={{ margin: '8px -18px -16px -18px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="auth-tab-btn"
                  style={{ width: 'auto', padding: '6px 14px' }}
                  data-testid="cancel-announcement-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="submit-button"
                  style={{ margin: 0, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  data-testid="submit-announcement-btn"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
