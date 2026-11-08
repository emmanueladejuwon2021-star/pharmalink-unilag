const API_BASE = '/api';

export async function fetchFeed(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val !== 'all' && val !== 'All Levels') {
      params.append(key, val);
    }
  });

  const queryStr = params.toString();
  const url = `${API_BASE}/posts${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch social feed');
  }
  return data;
}

export async function fetchPostById(token, id) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch post');
  }
  return data;
}

export async function createPost(token, postData) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create post');
  }
  return data;
}

export async function updatePost(token, id, updateData) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update post');
  }
  return data;
}

export async function deletePost(token, id) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete post');
  }
  return data;
}

export async function togglePinPost(token, id) {
  const res = await fetch(`${API_BASE}/posts/${id}/pin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to toggle pin');
  }
  return data;
}

export async function fetchComments(token, postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch comments');
  }
  return data;
}

export async function createComment(token, postId, commentData) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(commentData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to post comment');
  }
  return data;
}

export async function deleteComment(token, postId, commentId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete comment');
  }
  return data;
}

// Social Engagement (EPIC-009)
export async function toggleLikePost(token, id) {
  const res = await fetch(`${API_BASE}/posts/${id}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to toggle like');
  }
  return data;
}

export async function toggleLikeComment(token, postId, commentId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments/${commentId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to toggle comment like');
  }
  return data;
}

export async function toggleReLinkPost(token, id) {
  const res = await fetch(`${API_BASE}/posts/${id}/relink`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to toggle re-link');
  }
  return data;
}

export async function toggleBookmarkPost(token, id) {
  const res = await fetch(`${API_BASE}/posts/${id}/bookmark`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to toggle bookmark');
  }
  return data;
}

export async function fetchBookmarks(token) {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch bookmarks');
  }
  return data;
}
