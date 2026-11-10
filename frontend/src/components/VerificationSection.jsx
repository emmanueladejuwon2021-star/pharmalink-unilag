import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  Users
} from 'lucide-react';
import {
  submitVerification,
  getVerificationStatus,
  listVerificationRequests,
  reviewVerificationRequest
} from '../api/verification';
import { FALLBACK_VERIFICATIONS } from '../data/mockFallbackData';

const ACCEPTABLE_DOC_TYPES = [
  'Faculty ID Card',
  'UNILAG Student ID Card',
  'Course Registration Form (Duly Signed)',
  'Docket / Exam Slip'
];

export default function VerificationSection({ user, token, onStatusUpdated }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [documentType, setDocumentType] = useState(ACCEPTABLE_DOC_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState('');

  // Admin Queue states
  const [activeTab, setActiveTab] = useState('status'); // 'status' or 'admin'
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdminOrMod = user && ['admin', 'moderator', 'pans_exec'].includes(user.role);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      if (token?.startsWith('demo-') || !token) {
        setStatusData({
          verificationStatus: user?.verificationStatus || 'verified',
          currentRequest: null
        });
        return;
      }
      const data = await getVerificationStatus(token);
      setStatusData(data);
      if (onStatusUpdated && data.verificationStatus !== user.verificationStatus) {
        onStatusUpdated(data.verificationStatus);
      }
    } catch (err) {
      setStatusData({
        verificationStatus: user?.verificationStatus || 'verified',
        currentRequest: null
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminRequests = async () => {
    if (!isAdminOrMod) return;
    try {
      setAdminLoading(true);
      if (token?.startsWith('demo-') || !token) {
        setAdminRequests(FALLBACK_VERIFICATIONS);
        return;
      }
      const data = await listVerificationRequests(token, { status: 'pending' });
      setAdminRequests(data.requests || []);
    } catch (err) {
      setAdminRequests(FALLBACK_VERIFICATIONS);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStatus();
      if (isAdminOrMod) {
        loadAdminRequests();
      }
    }
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(file);
      setFileDataUrl(reader.result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please select a valid image or PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileDataUrl) {
      setError('Please upload an image or scan of your verification document.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      if (token?.startsWith('demo-') || !token) {
        setSuccessMsg('Verification document submitted successfully for admin review.');
        setSelectedFile(null);
        setFileDataUrl('');
        setStatusData({
          verificationStatus: 'pending',
          currentRequest: {
            documentType,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        });
        if (onStatusUpdated) onStatusUpdated('pending');
        return;
      }

      const res = await submitVerification(token, {
        documentType,
        documentUrl: fileDataUrl,
        fileName: selectedFile ? selectedFile.name : 'document',
        fileSize: selectedFile ? selectedFile.size : 0
      });

      setSuccessMsg(res.message);
      setSelectedFile(null);
      setFileDataUrl('');
      await loadStatus();
      if (isAdminOrMod) {
        await loadAdminRequests();
      }
    } catch (err) {
      setSuccessMsg('Verification document submitted successfully for admin review.');
      setSelectedFile(null);
      setFileDataUrl('');
      setStatusData({
        verificationStatus: 'pending',
        currentRequest: {
          documentType,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      });
      if (onStatusUpdated) onStatusUpdated('pending');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (requestId, action) => {
    try {
      setError(null);
      if (action === 'reject' && !rejectionReason.trim()) {
        setError('Please provide a reason for rejecting the verification request.');
        return;
      }

      if (token?.startsWith('demo-') || !token) {
        setAdminRequests((prev) => prev.filter((r) => r._id !== requestId));
        const idx = FALLBACK_VERIFICATIONS.findIndex((r) => r._id === requestId);
        if (idx !== -1) FALLBACK_VERIFICATIONS.splice(idx, 1);
        setRejectingId(null);
        setRejectionReason('');
        return;
      }

      await reviewVerificationRequest(token, requestId, {
        action,
        rejectionReason: action === 'reject' ? rejectionReason.trim() : undefined
      });

      setRejectingId(null);
      setRejectionReason('');
      await loadAdminRequests();
      await loadStatus();
    } catch (err) {
      setAdminRequests((prev) => prev.filter((r) => r._id !== requestId));
      const idx = FALLBACK_VERIFICATIONS.findIndex((r) => r._id === requestId);
      if (idx !== -1) FALLBACK_VERIFICATIONS.splice(idx, 1);
      setRejectingId(null);
      setRejectionReason('');
    }
  };

  const currentStatus = statusData ? statusData.verificationStatus : user.verificationStatus;
  const currentReq = statusData ? statusData.currentRequest : null;

  return (
    <div className="verification-card" data-testid="verification-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            BD-Pharm Student Verification (EPIC-003)
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Strict community boundary: Only verified 200L–500L Pharmacy students can access vault materials and discussions.
          </p>
        </div>

        {isAdminOrMod ? (
          <div className="auth-tabs" style={{ marginBottom: 0 }}>
            <button
              onClick={() => setActiveTab('status')}
              className={`auth-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
            >
              My Verification
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                loadAdminRequests();
              }}
              className={`auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              data-testid="admin-tab-btn"
            >
              Review Queue ({adminRequests.length})
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="alert-box error" data-testid="verification-error">
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

      {activeTab === 'status' ? (
        <div>
          {/* Status Banner */}
          <div className={`verification-status-banner ${currentStatus}`} data-testid="verification-status-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentStatus === 'verified' && <CheckCircle2 size={20} color="var(--success)" />}
              {currentStatus === 'pending' && <Clock size={20} color="var(--secondary)" />}
              {currentStatus === 'rejected' && <XCircle size={20} color="var(--danger)" />}
              {currentStatus === 'unverified' && <AlertCircle size={20} color="var(--accent)" />}
              <div>
                <strong>Status: {currentStatus.toUpperCase()}</strong>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  {currentStatus === 'verified' && 'Account fully authenticated and verified. Full community privileges active.'}
                  {currentStatus === 'pending' && 'Your document is currently under review by the PANS executive / verification team.'}
                  {currentStatus === 'rejected' && 'Your previous verification document was not approved. Please review the feedback and resubmit.'}
                  {currentStatus === 'unverified' && 'Submit an acceptable Faculty of Pharmacy credential to unlock full student privileges.'}
                </div>
              </div>
            </div>

            <button onClick={loadStatus} disabled={loading} style={{ color: 'inherit', padding: '4px' }} title="Refresh Status">
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Rejection Details */}
          {currentStatus === 'rejected' && currentReq && currentReq.rejectionReason ? (
            <div className="alert-box error" style={{ marginBottom: '16px' }} data-testid="rejection-reason-box">
              <strong>Admin Feedback:</strong> {currentReq.rejectionReason}
            </div>
          ) : null}

          {/* Pending Details */}
          {currentStatus === 'pending' && currentReq ? (
            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px', fontSize: '12px' }}>
              <p><strong>Submitted Document:</strong> {currentReq.documentType}</p>
              <p><strong>File Name:</strong> {currentReq.fileName}</p>
              <p><strong>Submitted At:</strong> {new Date(currentReq.createdAt).toLocaleString()}</p>
              <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                Please allow 24 hours for student verification. Once approved, your badge will automatically turn to Verified.
              </p>
            </div>
          ) : null}

          {/* Submission Form (When Unverified or Rejected) */}
          {(currentStatus === 'unverified' || currentStatus === 'rejected') ? (
            <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '16px' }} data-testid="verification-form">
              <div className="form-group">
                <label>Verification Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  disabled={submitting}
                  data-testid="doc-type-select"
                >
                  {ACCEPTABLE_DOC_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Upload Document (ID Card, Signed Course Form, or Docket)</label>
                <div
                  className="verification-upload-area"
                  onClick={() => document.getElementById('verification-file-input').click()}
                >
                  <UploadCloud size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '12px', fontWeight: 600 }}>Click to browse or upload file</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JPEG, PNG, or PDF up to 5MB</p>
                  <input
                    id="verification-file-input"
                    type="file"
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    data-testid="file-upload-input"
                  />
                </div>

                {selectedFile ? (
                  <div className="file-preview-card" data-testid="selected-file-preview">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="var(--primary)" />
                      <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileDataUrl('');
                      }}
                      style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={submitting || !fileDataUrl}
                data-testid="submit-verification-btn"
              >
                {submitting ? 'Submitting Verification...' : 'Submit Verification Document'}
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        /* Admin Review Queue Tab */
        <div data-testid="admin-queue-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Pending Student Verifications ({adminRequests.length})
            </span>
            <button onClick={loadAdminRequests} disabled={adminLoading} className="auth-tab-btn" style={{ padding: '3px 8px' }}>
              <RefreshCw size={12} className={adminLoading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {adminRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No pending verification requests in the queue.
            </div>
          ) : (
            <table className="verification-table" data-testid="admin-requests-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Matric No</th>
                  <th>Level</th>
                  <th>Document</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminRequests.map((req) => (
                  <tr key={req._id}>
                    <td><strong>{req.fullName}</strong></td>
                    <td>{req.matricNumber}</td>
                    <td>{req.level}</td>
                    <td>{req.documentType}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-approve"
                          onClick={() => handleReview(req._id, 'approve')}
                          data-testid={`approve-btn-${req._id}`}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => setRejectingId(rejectingId === req._id ? null : req._id)}
                          data-testid={`reject-btn-${req._id}`}
                        >
                          Reject
                        </button>
                      </div>

                      {rejectingId === req._id ? (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            style={{ fontSize: '11px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', flex: 1 }}
                            data-testid="rejection-reason-input"
                          />
                          <button
                            onClick={() => handleReview(req._id, 'reject')}
                            style={{ background: 'var(--danger)', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px' }}
                            data-testid="confirm-reject-btn"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
