const API_BASE = '/api';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchAdminMetrics({ token } = {}) {
  const res = await fetch(`${API_BASE}/admin/metrics`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch admin metrics');
  return data;
}

export async function fetchVerificationQueue({ status = 'pending', level, token } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (level) params.append('level', level);

  const res = await fetch(`${API_BASE}/admin/verifications?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch verification queue');
  return data;
}

export async function approveVerification(id, { token } = {}) {
  const res = await fetch(`${API_BASE}/admin/verifications/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve verification');
  return data;
}

export async function rejectVerification(id, reason, { token } = {}) {
  const res = await fetch(`${API_BASE}/admin/verifications/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ reason })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject verification');
  return data;
}

export async function fetchPlatformUsers({ role, level, search, limit, token } = {}) {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (level) params.append('level', level);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
  return data;
}

export async function updateUserRole(id, role, { token } = {}) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update user role');
  return data;
}

export async function toggleUserSuspension(id, { token } = {}) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/suspend`, {
    method: 'PATCH',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle suspension');
  return data;
}
