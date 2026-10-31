const API_BASE = '/api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch user session');
  }
  return data;
}
