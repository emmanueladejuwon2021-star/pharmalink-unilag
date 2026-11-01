const API_BASE = '/api';

export async function getDepartments() {
  const res = await fetch(`${API_BASE}/academic/departments`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch departments');
  }
  return data;
}

export async function getCurrentAcademicSession() {
  const res = await fetch(`${API_BASE}/academic/sessions/current`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch current academic session');
  }
  return data;
}

export async function getAcademicSessions(token) {
  const res = await fetch(`${API_BASE}/academic/sessions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch academic sessions');
  }
  return data;
}

export async function createAcademicSession(token, sessionData) {
  const res = await fetch(`${API_BASE}/academic/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create academic session');
  }
  return data;
}

export async function setCurrentAcademicSession(token, sessionId, sessionData = {}) {
  const res = await fetch(`${API_BASE}/academic/sessions/${sessionId}/set-current`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to set current academic session');
  }
  return data;
}

export async function getCourses(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val !== 'all') {
      params.append(key, val);
    }
  });

  const queryStr = params.toString();
  const url = `${API_BASE}/academic/courses${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch courses');
  }
  return data;
}

export async function createCourse(token, courseData) {
  const res = await fetch(`${API_BASE}/academic/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(courseData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to register course');
  }
  return data;
}

export async function updateCourse(token, courseId, updateData) {
  const res = await fetch(`${API_BASE}/academic/courses/${courseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update course');
  }
  return data;
}

export async function deleteCourse(token, courseId) {
  const res = await fetch(`${API_BASE}/academic/courses/${courseId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete course');
  }
  return data;
}
