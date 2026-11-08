const API_BASE = '/api';

export async function fetchMaterials(token, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      params.append(key, val);
    }
  });

  const queryStr = params.toString();
  const url = `${API_BASE}/materials${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch materials');
  }
  return data;
}

export async function fetchMaterialById(token, id) {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch material');
  }
  return data;
}

export async function uploadMaterial(token, materialData) {
  const res = await fetch(`${API_BASE}/materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(materialData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to upload material');
  }
  return data;
}

export async function downloadMaterial(token, id) {
  const res = await fetch(`${API_BASE}/materials/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to download material');
  }
  return data;
}

export async function updateMaterial(token, id, data) {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.message || 'Failed to update material');
  }
  return resData;
}

export async function deleteMaterial(token, id) {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete material');
  }
  return data;
}
