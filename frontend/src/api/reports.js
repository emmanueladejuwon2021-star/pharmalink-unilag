const API_BASE = '/api';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function submitReport(payload, { token } = {}) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit report');
  return data;
}

export async function fetchReportsQueue({ status = 'pending', contentType, token } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (contentType) params.append('contentType', contentType);

  const res = await fetch(`${API_BASE}/reports?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch reports');
  return data;
}

export async function resolveReport(id, payload, { token } = {}) {
  const res = await fetch(`${API_BASE}/reports/${id}/resolve`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to resolve report');
  return data;
}
