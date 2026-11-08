const API_BASE = '/api';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function searchAll(query, { type = 'all', level, department, limit = 10, token } = {}) {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (type) params.append('type', type);
  if (level) params.append('level', level);
  if (department) params.append('department', department);
  if (limit) params.append('limit', limit);

  const res = await fetch(`${API_BASE}/search?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Search failed');
  }
  return data;
}
