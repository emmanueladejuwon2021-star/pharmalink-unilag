import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Pin,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Filter,
  AlertCircle,
  Eye,
  Heart,
  Share2,
  Hash,
  ShieldCheck,
  Award
} from 'lucide-react';
import {
  fetchFeed,
  createPost,
  updatePost,
  deletePost,
  togglePinPost,
  fetchComments,
  createComment,
  deleteComment
} from '../api/posts';

const CATEGORIES = [
  'All',
  'Academic Discussion',
  'Exam Preparation',
  'Lab & Practical',
  'General Announcement',
  'PANS Official',
  'Student Life'
];

const AUDIENCE_LEVELS = ['All Levels', '200L', '300L', '400L', '500L'];

const DEPARTMENTS = [
  { code: 'all', name: 'All Departments' },
  { code: 'CPH', name: 'Clinical Pharmacy' },
  { code: 'PCH', name: 'Pharm Chemistry' },
  { code: 'PCT', name: 'Pharmaceutics' },
  { code: 'PCG', name: 'Pharmacognosy' },
  { code: 'PCL', name: 'Pharmacology' }
];

export default function FeedSection({ user, token }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filter state
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // Creator state
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    category: 'Academic Discussion',
    level: user?.level || 'All Levels',
    department: user?.department || '',
    courseCode: '',
    tags: '',
    isPinned: false
  });

  // Edit state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Discussion & Comments state (EPIC-008)
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  const isVerified = user?.verificationStatus === 'verified';
  const canPin = user && ['admin', 'moderator', 'pans_exec'].includes(user.role);

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFeed(token, {
        level: selectedLevel !== 'All Levels' ? selectedLevel : undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        department: selectedDept !== 'all' ? selectedDept : undefined,
        search: searchQuery.trim() || undefined,
        tag: activeTag || undefined,
        sort: sortBy
      });
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadFeed();
    }
  }, [token, selectedLevel, selectedCategory, selectedDept, activeTag, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadFeed();
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.content.trim()) return;

    try {
      setPublishing(true);
      setError(null);
      setSuccessMsg(null);

      const parsedTags = postForm.tags
        ? postForm.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
        : [];

      const res = await createPost(token, {
        title: postForm.title,
        content: postForm.content,
        category: postForm.category,
        level: postForm.level,
        department: postForm.department || null,
        courseCode: postForm.courseCode || null,
        tags: parsedTags,
        isPinned: postForm.isPinned
      });

      setSuccessMsg('Your post has been published to the BD-Pharm network!');
      setPostForm({
        title: '',
        content: '',
        category: 'Academic Discussion',
        level: user?.level || 'All Levels',
        department: user?.department || '',
        courseCode: '',
        tags: '',
        isPinned: false
      });
      setCreatorOpen(false);

      // Prepend to feed
      setPosts((prev) => [res.post, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(token, postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setSuccessMsg('Post deleted successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePin = async (postId) => {
    try {
      const res = await togglePinPost(token, postId);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, isPinned: res.post.isPinned } : p))
      );
      setSuccessMsg(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartEdit = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !editContent.trim()) return;
    try {
      setSavingEdit(true);
      const res = await updatePost(token, editingPost._id, {
        content: editContent
      });
      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? { ...p, content: res.post.content, isEdited: true } : p))
      );
      setEditingPost(null);
      setSuccessMsg('Post updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Discussion & Comments handlers (EPIC-008)
  const handleToggleComments = async (postId) => {
    const isCurrentlyOpen = !!expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isCurrentlyOpen }));

    if (!isCurrentlyOpen && !commentsByPost[postId]) {
      try {
        setLoadingComments((prev) => ({ ...prev, [postId]: true }));
        const data = await fetchComments(token, postId);
        setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      setError(null);
      const res = await createComment(token, postId, { content });

      // Append to comments list
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment]
      }));

      // Increment repliesCount on the post
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, repliesCount: (p.repliesCount || 0) + 1 } : p))
      );

      // Clear input
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await deleteComment(token, postId, commentId);
      // Mark as deleted in local state
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c._id === commentId ? { ...c, isDeleted: true, content: '[This comment was deleted]' } : c
        )
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, repliesCount: Math.max(0, (p.repliesCount || 1) - 1) } : p
        )
      );
    } catch (err) {
      setError(err.message);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card" data-testid="feed-section">
      {/* Feed Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--primary)" />
            Social Feed & Academic Discussions (EPIC-006 & EPIC-007)
          </h2>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            Real-time peer discussions, course guides, exam tips, and official announcements across UNILAG Pharmacy.
          </p>
        </div>

        {isVerified && (
          <button
            onClick={() => setCreatorOpen(!creatorOpen)}
            className="submit-button"
            style={{ padding: '8px 16px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
            data-testid="create-post-btn"
          >
            <Send size={14} />
            {creatorOpen ? 'Close Creator' : 'Create Post'}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="alert-box error" data-testid="feed-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-box" data-testid="feed-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Unverified student prompt */}
      {!isVerified && (
        <div className="notice-box" style={{ background: '#fffbeb', borderLeftColor: '#f59e0b', marginBottom: '16px' }} data-testid="unverified-feed-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
            <ShieldCheck size={18} />
            <strong>Posting Restricted to Verified Pharmacy Students</strong>
          </div>
          <p style={{ fontSize: '12px', marginTop: '4px', color: '#78350f' }}>
            Your account is currently <strong>{user?.verificationStatus?.toUpperCase() || 'UNVERIFIED'}</strong>. You can browse public faculty discussions, but must submit your UNILAG ID card in the <strong>Student Verification</strong> tab to publish posts.
          </p>
        </div>
      )}

      {/* Post Creator Form */}
      {isVerified && creatorOpen && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}
          data-testid="post-creator-box"
        >
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={15} color="var(--primary)" /> Publish to BD-Pharm Network
          </h3>

          <form onSubmit={handleCreatePost}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Post title or topic summary (optional)"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                maxLength={150}
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)' }}
                data-testid="post-title-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <textarea
                placeholder="Share academic insights, exam preparation tips, lab notes, or questions... Include #hashtags like #PCH301 or #medicinalchem"
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                required
                rows={4}
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)', resize: 'vertical' }}
                data-testid="post-content-textarea"
              />
            </div>

            {/* Metadata selections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                  style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  data-testid="post-category-select"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Level</label>
                <select
                  value={postForm.level}
                  onChange={(e) => setPostForm({ ...postForm, level: e.target.value })}
                  style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  data-testid="post-level-select"
                >
                  {AUDIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</label>
                <select
                  value={postForm.department}
                  onChange={(e) => setPostForm({ ...postForm, department: e.target.value })}
                  style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  data-testid="post-dept-select"
                >
                  <option value="">General / All Departments</option>
                  {DEPARTMENTS.filter((d) => d.code !== 'all').map((d) => (
                    <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. PCH 301 (optional)"
                  value={postForm.courseCode}
                  onChange={(e) => setPostForm({ ...postForm, courseCode: e.target.value })}
                  style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  data-testid="post-course-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Additional tags separated by commas"
                  value={postForm.tags}
                  onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', width: '220px' }}
                  data-testid="post-tags-input"
                />

                {canPin && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#b45309', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={postForm.isPinned}
                      onChange={(e) => setPostForm({ ...postForm, isPinned: e.target.checked })}
                      data-testid="pin-checkbox"
                    />
                    <Pin size={13} /> Pin as Official Announcement
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCreatorOpen(false)}
                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', background: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing || !postForm.content.trim()}
                  className="submit-button"
                  style={{ padding: '6px 16px', margin: 0, fontSize: '12px' }}
                  data-testid="submit-post-btn"
                >
                  {publishing ? 'Publishing...' : 'Publish Post (+5 pts)'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Feed Filters & Search Toolbar */}
      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }} data-testid="feed-filters-toolbar">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search feed by keywords, topics, or course codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 8px 6px 28px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
              data-testid="feed-search-input"
            />
          </div>
          <button
            type="submit"
            className="submit-button"
            style={{ padding: '6px 14px', margin: 0, fontSize: '12px' }}
            data-testid="feed-search-btn"
          >
            Search
          </button>
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag('')}
              style={{ padding: '6px 10px', fontSize: '11px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              #{activeTag} &times;
            </button>
          )}
        </form>

        {/* Level pills & Department dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {AUDIENCE_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`auth-tab-btn ${selectedLevel === lvl ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                data-testid={`filter-level-${lvl}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border)' }}
              data-testid="filter-category-select"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border)' }}
              data-testid="filter-dept-select"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border)' }}
              data-testid="sort-by-select"
            >
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feed Post List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }} data-testid="feed-loading">
          Loading discussion feed...
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }} data-testid="empty-feed">
          <MessageSquare size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>No discussions found</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 0 }}>
            No posts match the current filter. Be the first to start an academic discussion!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} data-testid="feed-list">
          {posts.map((post) => (
            <div
              key={post._id}
              style={{
                border: post.isPinned ? '2px solid #fbbf24' : '1px solid var(--border)',
                background: post.isPinned ? '#fffdf7' : '#fff',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
              data-testid={`post-card-${post._id}`}
            >
              {/* Pinned announcement banner */}
              {post.isPinned && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
                  <Pin size={12} fill="#b45309" />
                  PINNED ANNOUNCEMENT
                </div>
              )}

              {/* Author Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  >
                    {getInitials(post.author?.fullName)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        {post.author?.fullName}
                      </strong>
                      {post.author?.verificationStatus === 'verified' && (
                        <span title="Verified Pharmacy Student" style={{ display: 'inline-flex' }}>
                          <CheckCircle2 size={13} color="var(--success)" />
                        </span>
                      )}
                      <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                        {post.author?.level || post.level}
                      </span>
                      {post.author?.department && (
                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '10px' }}>
                          {post.author.department}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDate(post.createdAt)}
                      {post.isEdited && <span style={{ marginLeft: '4px', fontStyle: 'italic' }}>(edited)</span>}
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', background: '#f8fafc', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {post.category}
                  </span>

                  {post.courseCode && (
                    <span style={{ fontSize: '11px', background: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      {post.courseCode}
                    </span>
                  )}

                  {/* Pin toggle for privileged users */}
                  {canPin && (
                    <button
                      onClick={() => handleTogglePin(post._id)}
                      title={post.isPinned ? 'Unpin' : 'Pin Announcement'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: post.isPinned ? '#b45309' : 'var(--text-muted)', padding: '2px' }}
                      data-testid={`pin-btn-${post._id}`}
                    >
                      <Pin size={14} fill={post.isPinned ? '#b45309' : 'none'} />
                    </button>
                  )}

                  {/* Edit/Delete for author or admin */}
                  {(post.isAuthor || user?.role === 'admin') && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {post.isAuthor && (
                        <button
                          onClick={() => handleStartEdit(post)}
                          title="Edit post"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          data-testid={`edit-post-${post._id}`}
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        title="Delete post"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                        data-testid={`delete-post-${post._id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title if present */}
              {post.title ? (
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                  {post.title}
                </h3>
              ) : null}

              {/* Post Content */}
              <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-main)', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>
                {post.content}
              </div>

              {/* Hashtags */}
              {post.tags && post.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {post.tags.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTag(tag)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      data-testid={`tag-${tag}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Engagement Counter Footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Heart size={14} /> {post.likesCount || 0}
                </span>

                {/* Clickable replies toggle button */}
                <button
                  onClick={() => handleToggleComments(post._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: expandedComments[post._id] ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: expandedComments[post._id] ? 600 : 400,
                    fontSize: '12px',
                    padding: '2px 4px',
                    borderRadius: '4px'
                  }}
                  data-testid={`toggle-comments-${post._id}`}
                >
                  <MessageSquare size={14} /> {post.repliesCount || 0} replies
                </button>

                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Share2 size={14} /> {post.reLinksCount || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  <Eye size={13} /> {post.viewsCount || 0} views
                </span>
              </div>

              {/* Threaded Comments & Discussions Section (EPIC-008) */}
              {expandedComments[post._id] && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9'
                  }}
                  data-testid={`comments-section-${post._id}`}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Discussions & Peer Answers
                  </div>

                  {loadingComments[post._id] ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '8px 0' }} data-testid={`comments-loading-${post._id}`}>
                      Loading replies...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {(!commentsByPost[post._id] || commentsByPost[post._id].length === 0) ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                          No comments yet. Start the conversation!
                        </div>
                      ) : (
                        commentsByPost[post._id].map((comment) => (
                          <div
                            key={comment._id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px'
                            }}
                            data-testid={`comment-card-${comment._id}`}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                  {comment.author?.fullName || (comment.isDeleted ? 'Deleted User' : 'Unknown')}
                                </span>
                                {comment.author?.verificationStatus === 'verified' && (
                                  <CheckCircle2 size={11} color="var(--success)" />
                                )}
                                {comment.author?.level && (
                                  <span style={{ fontSize: '9px', background: '#e0e7ff', color: '#3730a3', padding: '1px 4px', borderRadius: '4px' }}>
                                    {comment.author.level}
                                  </span>
                                )}
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  {formatDate(comment.createdAt)}
                                </span>
                                {comment.isEdited && (
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    (edited)
                                  </span>
                                )}
                              </div>

                              {/* Delete button if authorized and not already deleted */}
                              {!comment.isDeleted && (comment.isAuthor || (comment.author && comment.author._id === user?._id) || user?.role === 'admin' || user?.role === 'moderator') && (
                                <button
                                  onClick={() => handleDeleteComment(post._id, comment._id)}
                                  title="Delete reply"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                  data-testid={`delete-comment-${comment._id}`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>

                            <div style={{ color: comment.isDeleted ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: comment.isDeleted ? 'italic' : 'normal' }}>
                              {comment.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Add comment form */}
                  {isVerified ? (
                    <form onSubmit={(e) => handleAddComment(post._id, e)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Write a comment or academic answer..."
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }}
                        data-testid={`comment-input-${post._id}`}
                      />
                      <button
                        type="submit"
                        disabled={submittingComment[post._id] || !(commentInputs[post._id] || '').trim()}
                        className="submit-button"
                        style={{ padding: '6px 12px', margin: 0, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        data-testid={`submit-comment-btn-${post._id}`}
                      >
                        <Send size={12} />
                        {submittingComment[post._id] ? 'Posting...' : 'Reply (+2 pts)'}
                      </button>
                    </form>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#b45309', background: '#fffbeb', padding: '6px 10px', borderRadius: '4px' }} data-testid={`comment-unverified-prompt-${post._id}`}>
                      <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Verified students only can participate in discussions.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          data-testid="edit-modal"
        >
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Edit Post</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border)', resize: 'vertical', marginBottom: '12px' }}
              data-testid="edit-content-textarea"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setEditingPost(null)}
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', background: '#fff' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editContent.trim()}
                className="submit-button"
                style={{ padding: '6px 16px', margin: 0, fontSize: '12px' }}
                data-testid="save-edit-btn"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
