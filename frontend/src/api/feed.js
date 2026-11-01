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

export function listFeed(token, params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return request(`/feed${query ? `?${query}` : ''}`, { token });
}

export function createPost(token, post) {
  return request('/feed', { method: 'POST', token, body: post });
}

export function updatePost(token, id, changes) {
  return request(`/feed/${id}`, { method: 'PATCH', token, body: changes });
}

export function deletePost(token, id) {
  return request(`/feed/${id}`, { method: 'DELETE', token });
}

export function setPinned(token, id, pinned) {
  return request(`/feed/${id}/pin`, { method: 'POST', token, body: { pinned } });
}
