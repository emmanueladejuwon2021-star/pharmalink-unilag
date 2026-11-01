const API_BASE = '/api';

export async function submitVerification(token, submissionData) {
  const res = await fetch(`${API_BASE}/verification/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(submissionData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Verification submission failed');
  }
  return data;
}

export async function getVerificationStatus(token) {
  const res = await fetch(`${API_BASE}/verification/status`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch verification status');
  }
  return data;
}

export async function listVerificationRequests(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/verification/requests${query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch verification requests');
  }
  return data;
}

export async function reviewVerificationRequest(token, requestId, reviewData) {
  const res = await fetch(`${API_BASE}/verification/requests/${requestId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to review verification request');
  }
  return data;
}
