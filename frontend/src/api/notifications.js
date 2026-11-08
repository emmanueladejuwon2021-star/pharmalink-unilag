const API_BASE = '/api';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function fetchNotifications({ page = 1, limit = 20, token } = {}) {
  const res = await fetch(`${API_BASE}/notifications?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return data;
}

export async function fetchUnreadCount({ token } = {}) {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch unread count');
  return data;
}

export async function markNotificationAsRead(id, { token } = {}) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark notification as read');
  return data;
}

export async function markAllNotificationsAsRead({ token } = {}) {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark all as read');
  return data;
}
