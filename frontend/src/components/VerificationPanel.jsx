import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function VerificationPanel({ user, token, onStatusUpdated }) {
  const [docType, setDocType] = useState('Faculty ID Card');
  const [notes, setNotes] = useState('');
  const [fileSelected, setFileSelected] = useState(false);
  const [docDataUrl, setDocDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [myRequest, setMyRequest] = useState(null);

  // Fetch current verification status
  useEffect(() => {
    if (!token) return;
    fetch('/api/verification/status', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.request) {
          setMyRequest(data.request);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDocDataUrl(reader.result);
        setFileSelected(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docDataUrl) {
      setError('Please choose a photo or file of your student document.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: docType,
          documentUrl: docDataUrl,
          studentNote: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      setSuccessMsg('Your document was submitted! The pharmacy team will review it shortly.');
      setMyRequest(data.request);
      if (onStatusUpdated) {
        onStatusUpdated('pending');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" data-testid="verification-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <ShieldCheck color="var(--primary)" size={22} />
        <h3 className="card-title" style={{ margin: 0 }}>Student Verification</h3>
      </div>
      <p className="card-subtitle">
        To keep PharmaLink safe and exclusive to University of Lagos Pharmacy students, please confirm your student status.
      </p>

      {/* Current Status Display */}
      <div style={{ marginBottom: '16px' }}>
        {user.verificationStatus === 'verified' ? (
          <div className="status-banner verified" data-testid="status-verified-banner">
            <CheckCircle2 size={18} />
            <div>
              <strong>You are fully verified!</strong>
              <p style={{ margin: 0, fontSize: '12px' }}>
                You have full access to study materials, discussions, and student events.
              </p>
            </div>
          </div>
        ) : user.verificationStatus === 'pending' ? (
          <div className="status-banner pending" data-testid="status-pending-banner">
            <Clock size={18} />
            <div>
              <strong>Your document is being reviewed.</strong>
              <p style={{ margin: 0, fontSize: '12px' }}>
                Thank you for submitting your {myRequest?.documentType || 'document'}. You will receive full access as soon as our reps review it.
              </p>
            </div>
          </div>
        ) : (
          <div className="status-banner unverified" data-testid="status-unverified-banner">
            <AlertCircle size={18} />
            <div>
              <strong>Account Pending Verification</strong>
              <p style={{ margin: 0, fontSize: '12px' }}>
                Please upload a photo of your Faculty ID, UNILAG ID, or signed Course Registration Form below.
              </p>
            </div>
          </div>
        )}
      </div>

      {user.verificationStatus !== 'verified' && user.verificationStatus !== 'pending' && (
        <form onSubmit={handleSubmit} className="auth-form" data-testid="verification-form">
          {error && (
            <div className="alert-box error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-box success" data-testid="verification-success-alert">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="docType">Type of Document</label>
            <select
              id="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="Faculty ID Card">Faculty ID Card</option>
              <option value="UNILAG Student ID Card">UNILAG Student ID Card</option>
              <option value="Course Registration Form (Duly Signed)">Course Registration Form (Signed)</option>
              <option value="Docket / Exam Slip">Docket / Exam Slip</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="docUpload">Upload Document Photo or PDF</label>
            <input
              id="docUpload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              data-testid="document-file-input"
              required
            />
            {fileSelected && (
              <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                ✓ Document file selected and ready
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Note (Optional)</label>
            <input
              id="notes"
              type="text"
              placeholder="e.g. My matriculation year or level rep contact"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
            data-testid="submit-verification-btn"
          >
            {loading ? 'Submitting...' : 'Send for Review'}
          </button>
        </form>
      )}
    </div>
  );
}
