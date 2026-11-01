import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  HelpCircle,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Pin,
  Trash2,
  Lock,
  ShieldCheck,
  PenLine
} from 'lucide-react';
import { listFeed, createPost, deletePost, setPinned } from '../api/feed';

const FEED_TABS = [
  { id: 'all', label: 'All Posts' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'questions', label: 'Questions' },
  { id: 'announcements', label: 'Official' },
  { id: 'level', label: 'My Level' }
];

const ANNOUNCEMENT_ROLES = ['admin', 'moderator', 'pans_exec', 'level_rep'];
const TITLE_MAX = 140;
const BODY_MAX = 5000;

function timeAgo(iso) {
  const seconds = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function TypeBadge({ type }) {
  if (type === 'announcement') {
    return (
      <span className="feed-type-badge" style={{ background: '#fef3c7', color: '#92400e' }} data-testid="post-type-badge">
        <Megaphone size={11} /> Official
      </span>
    );
  }
  if (type === 'question') {
    return (
      <span className="feed-type-badge" style={{ background: '#ede9fe', color: '#5b21b6' }} data-testid="post-type-badge">
        <HelpCircle size={11} /> Question
      </span>
    );
  }
  return (
    <span className="feed-type-badge" style={{ background: '#dbeafe', color: '#1e40af' }} data-testid="post-type-badge">
      <MessageSquare size={11} /> Discussion
    </span>
  );
}

export default function SocialFeed({ user, token }) {
  const isVerified = user.verificationStatus === 'verified';
  const canAnnounce = ANNOUNCEMENT_ROLES.includes(user.role);

  const [tab, setTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '', type: 'discussion', visibility: 'community' });
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadFeed = useCallback(async () => {
    if (!isVerified) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listFeed(token, {
        tab,
        level: tab === 'level' ? user.level : undefined,
        search: searchTerm.trim() || undefined
      });
      setPosts(data.posts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, tab, searchTerm, user.level, isVerified]);

  useEffect(() => {
    loadFeed();
    // Debounced reload only when tab changes or explicit refresh; search on submit
  }, [tab]);

  const handlePublish = async (event) => {
    event.preventDefault();
    setFormError(null);
    setPosting(true);
    try {
      await createPost(token, draft);
      setDraft({ title: '', body: '', type: 'discussion', visibility: 'community' });
      setComposerOpen(false);
      setSuccessMsg('Your post is live in the community feed.');
      await loadFeed();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (postId) => {
    setError(null);
    try {
      const res = await deletePost(token, postId);
      setSuccessMsg(res.message || 'Post removed.');
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePin = async (postId, pinned) => {
    setError(null);
    try {
      const res = await setPinned(token, postId, pinned);
      setSuccessMsg(res.message);
      await loadFeed();
    } catch (err) {
      setError(err.message);
    }
  };

  // Private-community boundary — friendly, honest gate for unverified students
  if (!isVerified) {
    return (
      <div className="card" data-testid="feed-locked">
        <h2 className="card-title">
          <Lock size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          The Social Feed is for verified members
        </h2>
        <p className="card-subtitle">
          To keep PharmaLink safe and exclusive, only verified UNILAG Faculty of Pharmacy
          students can read or post in the community feed. Upload your student proof document
          from the Student Verification page to unlock it.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="social-feed">
      <div className="card" data-testid="feed-composer-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Community Feed</h2>
          <button
            className="submit-button"
            onClick={() => setComposerOpen((open) => !open)}
            data-testid="toggle-composer-btn"
          >
            <PenLine size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {composerOpen ? 'Close' : 'New Post'}
          </button>
        </div>

        {composerOpen && (
          <form onSubmit={handlePublish} data-testid="post-form" style={{ marginTop: 12 }}>
            {formError && (
              <div className="error-box" role="alert">
                <AlertCircle size={14} /> {formError}
              </div>
            )}
            <label className="field-label" htmlFor="post-title">Title</label>
            <input
              id="post-title"
              className="text-input"
              data-testid="post-title-input"
              placeholder="e.g. Study group for PHA301?"
              maxLength={TITLE_MAX}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <label className="field-label" htmlFor="post-body">Content</label>
            <textarea
              id="post-body"
              className="text-input"
              data-testid="post-body-input"
              rows={4}
              maxLength={BODY_MAX}
              placeholder="Share details, ask your question, or start a discussion…"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <div>
                <label className="field-label" htmlFor="post-type">Type</label>
                <select
                  id="post-type"
                  className="text-input"
                  data-testid="post-type-select"
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                >
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                  {canAnnounce && <option value="announcement">Official Announcement</option>}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="post-visibility">Who can see it</label>
                <select
                  id="post-visibility"
                  className="text-input"
                  data-testid="post-visibility-select"
                  value={draft.visibility}
                  onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}
                >
                  <option value="community">Whole Faculty</option>
                  <option value="level-only">My Level Only ({user.level})</option>
                </select>
              </div>
            </div>
            <button type="submit" className="submit-button" disabled={posting} style={{ marginTop: 10 }}>
              {posting ? <><Loader2 size={13} className="spin" /> Publishing…</> : 'Publish Post'}
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="error-box" role="alert" data-testid="feed-error">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="success-box" data-testid="feed-success">
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}

      <div className="card" data-testid="feed-list-card">
        <div className="feed-tabs" role="tablist" data-testid="feed-tabs">
          {FEED_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`feed-tab ${tab === t.id ? 'active' : ''}`}
              data-testid={`feed-tab-${t.id}`}
              onClick={() => setTab(t.id)}
            >
              {t.id === 'level' ? `${t.label} (${user.level})` : t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); loadFeed(); }}
          style={{ display: 'flex', gap: 8, margin: '10px 0' }}
          data-testid="feed-search-form"
        >
          <input
            className="text-input"
            data-testid="feed-search-input"
            placeholder="Search posts in the community…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="submit-button" style={{ padding: '6px 12px' }}>
            <Search size={14} />
          </button>
        </form>

        {loading ? (
          <div className="loading-row" data-testid="feed-loading">
            <Loader2 size={16} className="spin" /> Loading the community feed…
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state" data-testid="feed-empty">
            <MessageSquare size={22} />
            <p>
              {searchTerm.trim()
                ? `No posts match "${searchTerm.trim()}".`
                : 'No posts here yet. Be the first to start a discussion!'}
            </p>
          </div>
        ) : (
          <ul className="feed-list" data-testid="feed-posts">
            {posts.map((post) => (
              <li key={post._id} className="feed-item" data-testid={`feed-post-${post._id}`}>
                <div className="feed-item-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {post.isPinned && (
                      <span className="feed-pin-flag" data-testid="pinned-flag">
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                    <TypeBadge type={post.type} />
                    <strong>{post.authorName}</strong>
                    <span className="feed-meta">{post.authorLevel}</span>
                    {post.authorRole !== 'student' && (
                      <span className="feed-meta" title="Community role">
                        <ShieldCheck size={11} style={{ verticalAlign: 'middle' }} />{' '}
                        {post.authorRole.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <span className="feed-meta">{timeAgo(post.createdAt)}</span>
                </div>
                <h3 className="feed-title">{post.title}</h3>
                <p className="feed-body">{post.body}</p>
                <div className="feed-footer">
                  <span className="feed-meta">
                    {post.visibility === 'level-only'
                      ? `Level-only · ${post.targetLevel}`
                      : 'Faculty-wide'}
                    {post.courseCode ? ` · ${post.courseCode}` : ''}
                  </span>
                  <span style={{ display: 'flex', gap: 8 }}>
                    {post.viewerCanPin && post.type === 'announcement' && (
                      <button
                        className="feed-action-btn"
                        onClick={() => handlePin(post._id, !post.isPinned)}
                        data-testid={`pin-btn-${post._id}`}
                        title={post.isPinned ? 'Unpin announcement' : 'Pin to top of feed'}
                      >
                        <Pin size={12} /> {post.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                    )}
                    {post.viewerCanManage && (
                      <button
                        className="feed-action-btn danger"
                        onClick={() => handleDelete(post._id)}
                        data-testid={`delete-btn-${post._id}`}
                        title="Remove this post"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
