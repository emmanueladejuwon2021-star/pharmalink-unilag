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

export function getCurrentPeriod() {
  return request('/academic/current-period');
}

export function listCourses(token, params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return request(`/academic/courses${query ? `?${query}` : ''}`, { token });
}

export function createCourse(token, course) {
  return request('/academic/courses', { method: 'POST', token, body: course });
}

export function updateCourse(token, id, changes) {
  return request(`/academic/courses/${id}`, { method: 'PATCH', token, body: changes });
}

export function getMyAcademicPeriod(token) {
  return request('/academic/my-period', { token });
}

export function updateMyAcademicPeriod(token, period) {
  return request('/academic/my-period', { method: 'PUT', token, body: period });
}

export function promoteStudent(token, userId, reason) {
  return request(`/academic/admin/promote/${userId}`, {
    method: 'POST',
    token,
    body: { reason }
  });
}
