import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminVerificationList({ token, onReviewCompleted }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState({});

  const fetchRequests = () => {
    setLoading(true);
    fetch('/api/verification/admin/requests?status=all', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRequests(data.requests);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleReview = async (id, decision) => {
    try {
      const res = await fetch(`/api/verification/admin/review/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          reviewerNote: reviewNote[id] || ''
        })
      });

      const data = await res.json();
      if (res.ok) {
        fetchRequests();
        if (onReviewCompleted) onReviewCompleted(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card" data-testid="admin-verification-panel" style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 className="card-title" style={{ margin: 0 }}>Student Verification Review Desk</h3>
        <button
          onClick={fetchRequests}
          className="nav-link"
          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
          title="Refresh List"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <p className="card-subtitle">
        PANS executives and level representatives can review student identity documents below.
      </p>

      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading student submissions...</p>
      ) : requests.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No student submissions waiting for review.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((req) => (
            <div
              key={req._id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '12px',
                background: '#fafafa'
              }}
              data-testid={`request-row-${req._id}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <strong>{req.user?.fullName}</strong> ({req.user?.level}) &bull; Matric: {req.user?.matricNumber}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: req.status === 'verified' ? 'var(--success)' : req.status === 'pending' ? 'var(--accent)' : 'var(--danger)'
                  }}
                >
                  {req.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0' }}>
                Document: <strong>{req.documentType}</strong>
                {req.studentNote ? ` — "${req.studentNote}"` : ''}
              </p>

              {req.status === 'pending' && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Optional message to student..."
                    value={reviewNote[req._id] || ''}
                    onChange={(e) => setReviewNote({ ...reviewNote, [req._id]: e.target.value })}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}
                  />
                  <button
                    onClick={() => handleReview(req._id, 'approve')}
                    className="submit-button"
                    style={{ background: 'var(--primary)', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    data-testid={`approve-btn-${req._id}`}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleReview(req._id, 'reject')}
                    className="submit-button"
                    style={{ background: 'var(--danger)', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    data-testid={`reject-btn-${req._id}`}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
