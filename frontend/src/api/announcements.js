const API_BASE = '/api';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchAnnouncements({ category, priority, level, pinned, token } = {}) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (priority) params.append('priority', priority);
  if (level) params.append('level', level);
  if (pinned !== undefined) params.append('pinned', pinned);

  const res = await fetch(`${API_BASE}/announcements?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch announcements');
  return data;
}

export async function createAnnouncement(payload, { token } = {}) {
  const res = await fetch(`${API_BASE}/announcements`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to publish announcement');
  return data;
}

export async function togglePinAnnouncement(id, { token } = {}) {
  const res = await fetch(`${API_BASE}/announcements/${id}/pin`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle pin');
  return data;
}

export async function deleteAnnouncement(id, { token } = {}) {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete announcement');
  return data;
}
