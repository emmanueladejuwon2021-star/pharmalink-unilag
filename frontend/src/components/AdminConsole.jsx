import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  fetchAdminMetrics,
  fetchVerificationQueue,
  approveVerification,
  rejectVerification,
  fetchPlatformUsers,
  updateUserRole,
  toggleUserSuspension
} from '../api/admin';
import { fetchReportsQueue, resolveReport } from '../api/reports';

export default function AdminConsole({ token, currentUser }) {
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');

  const [activeTab, setActiveTab] = useState('verifications');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Verifications State
  const [verifications, setVerifications] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Reports State
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!isStaff) return;
    loadMetrics();
    if (activeTab === 'verifications') loadVerifications();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'reports') loadReports();
  }, [activeTab, isStaff]);

  if (!isStaff) {
    return (
      <div className="card" data-testid="admin-access-denied">
        <div className="alert-box error" style={{ margin: 0 }}>
          <ShieldAlert size={18} />
          <span>
            Access Denied: The BD-Pharm Administration Console requires Faculty Administrator or Moderator privileges.
          </span>
        </div>
      </div>
    );
  }

  async function loadMetrics() {
    try {
      const data = await fetchAdminMetrics({ token });
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  }

  async function loadVerifications() {
    try {
      setLoading(true);
      setError('');
      const data = await fetchVerificationQueue({ status: 'pending', token });
      setVerifications(data.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');
      const data = await fetchPlatformUsers({ search: userSearch, token });
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function loadReports() {
    try {
      setLoading(true);
      setError('');
      const data = await fetchReportsQueue({ status: 'pending', token });
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || 'Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveVerification(id) {
    try {
      setProcessingId(id);
      setError('');
      await approveVerification(id, { token });
      setVerifications((prev) => prev.filter((v) => v._id !== id));
      setSuccessMsg('Student verification approved successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadMetrics();
    } catch (err) {
      setError(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectVerification(id) {
    const reason = window.prompt('Please provide a reason for rejection:', 'Document unreadable or invalid.');
    if (!reason) return;
    try {
      setProcessingId(id);
      setError('');
      await rejectVerification(id, reason, { token });
      setVerifications((prev) => prev.filter((v) => v._id !== id));
      setSuccessMsg('Student verification rejected.');
      setTimeout(() => setSuccessMsg(''), 4000);
      loadMetrics();
    } catch (err) {
      setError(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      setError('');
      await updateUserRole(userId, newRole, { token });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      setSuccessMsg('User role updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Role change failed');
    }
  }

  async function handleToggleSuspend(userId) {
    try {
      setError('');
      const data = await toggleUserSuspension(userId, { token });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isSuspended: data.isSuspended } : u))
      );
      setSuccessMsg(data.isSuspended ? 'Student account suspended.' : 'Student account reinstated.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Suspension toggle failed');
    }
  }

  async function handleResolveReport(id, action) {
    try {
      setProcessingId(id);
      setError('');
      await resolveReport(id, { status: 'resolved', resolutionAction: action }, { token });
      setReports((prev) => prev.filter((r) => r._id !== id));
      setSuccessMsg(action === 'content_removed' ? 'Violating content removed.' : 'Report dismissed.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadMetrics();
    } catch (err) {
      setError(err.message || 'Report resolution failed');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="card" data-testid="admin-console">
      {/* Metrics Banner */}
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}
        data-testid="admin-metrics-banner"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldAlert size={18} color="#34d399" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
            BD-Pharm Administration & Governance
          </h2>
        </div>

        {metrics && (
          <div className="admin-metrics-grid">
            <div className="metric-card">
              <span className="metric-card-label">TOTAL STUDENTS</span>
              <span className="metric-card-val">{metrics.totalStudents}</span>
              <span style={{ fontSize: '10px', color: '#34d399' }}>
                {metrics.verificationRate}% Verified
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-card-label">PENDING VERIFICATIONS</span>
              <span className="metric-card-val" style={{ color: '#fbbf24' }}>
                {metrics.pendingVerifications}
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-card-label">DISCUSSIONS & VAULT</span>
              <span className="metric-card-val" style={{ color: '#38bdf8' }}>
                {metrics.totalPosts} / {metrics.totalMaterials}
              </span>
            </div>
            <div className="metric-card">
              <span className="metric-card-label">PENDING REPORTS</span>
              <span className="metric-card-val" style={{ color: '#f87171' }}>
                {metrics.pendingReports}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Nav Tabs */}
      <div className="admin-nav-tabs">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`admin-nav-tab ${activeTab === 'verifications' ? 'active' : ''}`}
          data-testid="admin-tab-verifications"
        >
          Verification Queue ({verifications.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`admin-nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          data-testid="admin-tab-users"
        >
          User Governance
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`admin-nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          data-testid="admin-tab-reports"
        >
          Moderation Reports ({reports.length})
        </button>
      </div>

      {/* Success & Error Banners */}
      {successMsg && (
        <div
          className="alert-box"
          style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
          data-testid="admin-success"
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-box error" data-testid="admin-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div
          style={{ textAlign: 'center', padding: '32px 0', fontSize: '12px', color: 'var(--text-muted)' }}
          data-testid="admin-loading"
        >
          <Loader2
            size={18}
            className="animate-spin"
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }}
          />
          Loading administrative records...
        </div>
      )}

      {/* TAB 1: Verification Queue */}
      {!loading && activeTab === 'verifications' && (
        <div>
          {verifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}
              data-testid="verifications-empty"
            >
              <CheckCircle size={24} color="#10b981" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              No pending student verification requests. All caught up!
            </div>
          ) : (
            verifications.map((req) => (
              <div
                key={req._id}
                className="admin-list-item"
                data-testid={`verification-item-${req._id}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                      {req.fullName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        background: '#f1f5f9',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}
                    >
                      {req.matricNumber}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--primary, #047857)',
                        fontWeight: 600,
                        background: 'var(--primary-light, #ecfdf5)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {req.level}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Document Type: <strong>{req.documentType}</strong> &bull;{' '}
                    <a
                      href={req.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--secondary, #0284c7)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                      data-testid={`view-doc-btn-${req._id}`}
                    >
                      View ID Document Attachment <ExternalLink size={11} />
                    </a>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleRejectVerification(req._id)}
                    disabled={processingId === req._id}
                    className="btn-reject"
                    data-testid={`reject-verification-btn-${req._id}`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveVerification(req._id)}
                    disabled={processingId === req._id}
                    className="btn-approve"
                    data-testid={`approve-verification-btn-${req._id}`}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: User Role Governance */}
      {!loading && activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Search by student name, matric, or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '13px'
              }}
              data-testid="user-search-input"
            />
            <button
              onClick={loadUsers}
              className="submit-button"
              style={{ margin: 0, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
              data-testid="user-search-btn"
            >
              <Search size={14} /> Search
            </button>
          </div>

          {users.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '12px' }}
              data-testid="users-empty"
            >
              No matching students found.
            </div>
          ) : (
            <div>
              {users.map((u) => (
                <div key={u._id} className="admin-list-item" data-testid={`user-item-${u._id}`}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
                        {u.fullName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({u.matricNumber})
                      </span>
                      {u.isSuspended && (
                        <span
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}
                        >
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {u.email} &bull; {u.level} &bull; Verification: <strong>{u.verificationStatus}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        fontSize: '11px',
                        background: '#ffffff'
                      }}
                      data-testid={`role-select-${u._id}`}
                    >
                      <option value="student">student</option>
                      <option value="level_rep">level_rep</option>
                      <option value="pans_exec">pans_exec</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>

                    <button
                      onClick={() => handleToggleSuspend(u._id)}
                      title={u.isSuspended ? 'Reinstate student account' : 'Suspend student account'}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '4px',
                        background: u.isSuspended ? '#ecfdf5' : '#fee2e2',
                        color: u.isSuspended ? '#047857' : '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                      data-testid={`suspend-user-btn-${u._id}`}
                    >
                      {u.isSuspended ? <Unlock size={13} /> : <Lock size={13} />}
                      {u.isSuspended ? 'Reinstate' : 'Suspend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Moderation Reports Queue */}
      {!loading && activeTab === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}
              data-testid="reports-empty"
            >
              <CheckCircle size={24} color="#10b981" style={{ margin: '0 auto 8px auto', display: 'block' }} />
              Clean slate! No pending content violation reports.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep._id}
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: '#ffffff',
                  marginBottom: '10px'
                }}
                data-testid={`report-item-${rep._id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#991b1b',
                        background: '#fee2e2',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {rep.reason}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Target: <strong>{rep.contentType}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Reported by {rep.reporter?.fullName || 'Peer Student'}
                  </span>
                </div>

                {rep.description && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-main)',
                      fontStyle: 'italic',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      margin: '6px 0',
                      borderLeft: '3px solid #f87171'
                    }}
                  >
                    "{rep.description}"
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleResolveReport(rep._id, 'none')}
                    disabled={processingId === rep._id}
                    style={{
                      padding: '5px 12px',
                      background: '#f1f5f9',
                      color: 'var(--text-muted)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    data-testid={`dismiss-report-btn-${rep._id}`}
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleResolveReport(rep._id, 'content_removed')}
                    disabled={processingId === rep._id}
                    style={{
                      padding: '5px 12px',
                      background: 'var(--danger, #ef4444)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    data-testid={`remove-content-btn-${rep._id}`}
                  >
                    <Trash2 size={12} /> Remove Content
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
