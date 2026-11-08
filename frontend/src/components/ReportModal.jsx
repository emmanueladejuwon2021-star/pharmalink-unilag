import React, { useState } from 'react';
import { Flag, X, AlertTriangle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { submitReport } from '../api/reports';

const REPORT_REASONS = [
  { value: 'misinformation', label: 'Misinformation / Incorrect Drug Information' },
  { value: 'harassment', label: 'Harassment / Abusive Behavior' },
  { value: 'exam_malpractice', label: 'Exam Malpractice / Unauthorized Materials' },
  { value: 'unauthorized_commercial', label: 'Commercial Advertisement / Solicitations' },
  { value: 'inappropriate_content', label: 'Inappropriate or Offensive Content' },
  { value: 'impersonation', label: 'Impersonation of Faculty / Executive' },
  { value: 'other', label: 'Other Faculty Rule Violation' }
];

export default function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  token,
  user
}) {
  const [reason, setReason] = useState('misinformation');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isVerified = user?.verificationStatus === 'verified';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isVerified) {
      setError('Student verification is required to submit content reports.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await submitReport(
        {
          contentType,
          contentId,
          reason,
          description: description.trim()
        },
        { token }
      );
      setSuccessMsg('Thank you. Your report has been submitted to the moderation team.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="report-modal-backdrop"
    >
      <div className="modal-container" style={{ maxWidth: '440px' }} data-testid="report-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ color: 'var(--danger, #ef4444)' }}>
            <Flag size={16} />
            <span>Report Content Violation</span>
          </div>
          <button
            onClick={onClose}
            className="btn-icon-close"
            data-testid="close-report-modal-btn"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Unverified Barrier */}
          {!isVerified ? (
            <div className="barrier-card" data-testid="unverified-report-barrier">
              <div className="barrier-header">
                <ShieldCheck size={16} />
                <span>Student Verification Required</span>
              </div>
              <p style={{ margin: 0, lineHeight: 1.4 }}>
                Only verified UNILAG Pharmacy students can submit moderation violation reports. This protects the academic community from spam and maintains accountability.
              </p>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button
                  onClick={onClose}
                  className="auth-tab-btn"
                  style={{ display: 'inline-block', width: 'auto', padding: '6px 14px' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : successMsg ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600
              }}
              data-testid="report-success-msg"
            >
              <CheckCircle2 size={24} style={{ margin: '0 auto 8px auto', display: 'block' }} />
              {successMsg}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" data-testid="report-form">
              {error && (
                <div className="alert-box error" data-testid="report-error-msg">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label>Reason for Report</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="report-reason-select"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Additional Context (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this content violates UNILAG Faculty guidelines or standards..."
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    resize: 'vertical'
                  }}
                  data-testid="report-description-input"
                />
              </div>

              <div className="modal-footer" style={{ margin: '12px -18px -16px -18px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="auth-tab-btn"
                  style={{ width: 'auto', padding: '6px 14px' }}
                  data-testid="cancel-report-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--danger, #ef4444)',
                    color: '#ffffff',
                    padding: '7px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                  data-testid="submit-report-btn"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
