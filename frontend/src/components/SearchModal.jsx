import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, BookOpen, Users, Loader2, ShieldAlert } from 'lucide-react';
import { searchAll } from '../api/search';

export default function SearchModal({
  isOpen,
  onClose,
  token,
  user,
  onSelectPost,
  onSelectMaterial,
  onSelectStudent
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ posts: [], materials: [], students: [] });
  const [counts, setCounts] = useState({ total: 0, posts: 0, materials: 0, students: 0 });
  const [error, setError] = useState('');

  const isVerified = user?.verificationStatus === 'verified';

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ posts: [], materials: [], students: [] });
      setCounts({ total: 0, posts: 0, materials: 0, students: 0 });
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      if (query.trim()) {
        executeSearch();
      } else {
        setResults({ posts: [], materials: [], students: [] });
        setCounts({ total: 0, posts: 0, materials: 0, students: 0 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, isOpen]);

  async function executeSearch() {
    try {
      setLoading(true);
      setError('');
      const data = await searchAll(query, { type: activeTab, token });
      setResults(data.results || { posts: [], materials: [], students: [] });
      setCounts(data.counts || { total: 0, posts: 0, materials: 0, students: 0 });
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="search-modal-backdrop"
    >
      <div className="modal-container search-modal-container" data-testid="search-modal">
        {/* Search Input Bar */}
        <div className="search-input-bar">
          <Search size={18} color="var(--primary, #047857)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            data-testid="global-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search discussions, materials vault, or pharmacy students..."
            className="search-input-field"
            autoFocus
          />
          {loading && (
            <Loader2
              size={16}
              className="animate-spin"
              style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }}
              data-testid="search-loading-spinner"
            />
          )}
          <button
            onClick={onClose}
            className="btn-icon-close"
            data-testid="close-search-btn"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Unverified notice barrier */}
        {!isVerified && (
          <div
            className="barrier-card"
            style={{ margin: '8px 16px 0 16px', padding: '8px 12px' }}
            data-testid="unverified-search-barrier"
          >
            <div className="barrier-header" style={{ fontSize: '11px', marginBottom: 2 }}>
              <ShieldAlert size={14} />
              <span>Unverified Student Preview</span>
            </div>
            <p style={{ fontSize: '11px', margin: 0, lineHeight: 1.35 }}>
              You are searching in preview mode. Verified UNILAG Pharmacy students can access complete
              lecture notes, download vault materials, and interact with peers.
            </p>
          </div>
        )}

        {/* Category Tabs */}
        <div className="search-tabs-row">
          <button
            onClick={() => setActiveTab('all')}
            className={`search-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            data-testid="search-tab-all"
          >
            All Results ({counts.total})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`search-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            data-testid="search-tab-posts"
          >
            Discussions ({counts.posts})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`search-tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            data-testid="search-tab-materials"
          >
            Vault Materials ({counts.materials})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`search-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            data-testid="search-tab-students"
          >
            Students ({counts.students})
          </button>
        </div>

        {/* Results List */}
        <div className="search-results-container">
          {error && (
            <div className="alert-box error" data-testid="search-error-alert">
              {error}
            </div>
          )}

          {!query.trim() && (
            <div
              style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '12px' }}
              data-testid="search-empty-prompt"
            >
              Type keywords such as "Pharmacognosy", "Dosage", "PCH 301", or student names to search across BD-Pharm.
            </div>
          )}

          {query.trim() && !loading && counts.total === 0 && (
            <div
              style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '12px' }}
              data-testid="search-no-results"
            >
              No matching discussions, materials, or students found for "{query}".
            </div>
          )}

          {/* Posts Results */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <div>
              <div className="search-group-title">
                <MessageSquare size={13} /> Discussions ({results.posts.length})
              </div>
              <div>
                {results.posts.map((post) => (
                  <div
                    key={post._id}
                    onClick={() => {
                      if (onSelectPost) onSelectPost(post);
                      onClose();
                    }}
                    className="search-result-card"
                    data-testid={`search-result-post-${post._id}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {post.author?.fullName || 'Pharmacy Student'}
                      </span>
                      <span
                        style={{
                          background: 'var(--primary-light, #ecfdf5)',
                          color: 'var(--primary, #047857)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600
                        }}
                      >
                        {post.category}
                      </span>
                    </div>
                    {post.title && (
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                        {post.title}
                      </div>
                    )}
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials Results */}
          {(activeTab === 'all' || activeTab === 'materials') && results.materials.length > 0 && (
            <div>
              <div className="search-group-title">
                <BookOpen size={13} /> Materials Vault ({results.materials.length})
              </div>
              <div>
                {results.materials.map((mat) => (
                  <div
                    key={mat._id}
                    onClick={() => {
                      if (onSelectMaterial) onSelectMaterial(mat);
                      onClose();
                    }}
                    className="search-result-card"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    data-testid={`search-result-material-${mat._id}`}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)' }}>
                          {mat.title}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontWeight: 600
                          }}
                        >
                          {mat.courseCode}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {mat.department} &bull; {mat.level} &bull; {mat.materialType}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--primary, #047857)', fontWeight: 700, flexShrink: 0 }}>
                      {mat.downloadsCount || 0} downloads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students Results */}
          {(activeTab === 'all' || activeTab === 'students') && results.students.length > 0 && (
            <div>
              <div className="search-group-title">
                <Users size={13} /> Pharmacy Students ({results.students.length})
              </div>
              <div>
                {results.students.map((stu) => (
                  <div
                    key={stu._id}
                    onClick={() => {
                      if (onSelectStudent) onSelectStudent(stu);
                      onClose();
                    }}
                    className="search-result-card"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    data-testid={`search-result-student-${stu._id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--primary, #047857)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px',
                          flexShrink: 0
                        }}
                      >
                        {stu.fullName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                          {stu.fullName}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {stu.level} &bull; {stu.department || 'Pharmacy'}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--accent, #f59e0b)', fontWeight: 600 }}>
                      ★ {stu.stats?.reputationPoints || 10} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
