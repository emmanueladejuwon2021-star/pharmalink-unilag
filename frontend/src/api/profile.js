const API_BASE = '/api';

export async function getMyProfile(token) {
  const res = await fetch(`${API_BASE}/profile/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch profile');
  }
  return data;
}

export async function updateMyProfile(token, profileData) {
  const res = await fetch(`${API_BASE}/profile/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }
  return data;
}

export async function getUserProfile(token, userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch student profile');
  }
  return data;
}

export async function listStudentDirectory(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val !== 'all') {
      params.append(key, val);
    }
  });

  const queryStr = params.toString();
  const url = `${API_BASE}/profile/directory/students${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch student directory');
  }
  return data;
}

export async function toggleFollowUser(token, userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to toggle follow');
  }
  return data;
}

export async function fetchFollowers(token, userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}/followers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch followers');
  }
  return data;
}

export async function fetchFollowing(token, userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}/following`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch following');
  }
  return data;
}

export async function fetchFollowStatus(token, userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}/follow-status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch follow status');
  }
  return data;
}
