const API_BASE = '/api';

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export function getMyProfile(token) {
  return request('/profiles/me', { token });
}

export function updateMyProfile(token, changes) {
  return request('/profiles/me', { method: 'PATCH', token, body: changes });
}

export function listProfiles(token, params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return request(`/profiles${query ? `?${query}` : ''}`, { token });
}

export function getProfileById(token, id) {
  return request(`/profiles/${id}`, { token });
}
