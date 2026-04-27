import { API_BASE_URL } from '../api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' && data ? data : data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.append(key, String(value));
  });

  return query.toString();
}

export const vendorService = {
  getVendors: ({ pageNumber, pageSize, searchTerm, status } = {}) => {
    const query = buildQuery({ pageNumber, pageSize, searchTerm, status });
    const suffix = query ? `?${query}` : '';
    return request(`/vendors${suffix}`);
  },
  getVendorById: (id) => request(`/vendors/${id}`),
  createVendor: (payload) => request('/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateVendor: (id, payload) => request(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deactivateVendor: (id) => request(`/vendors/${id}`, {
    method: 'DELETE',
  }),
  toggleVendorStatus: (id) => request(`/vendors/${id}/status`, {
    method: 'PATCH',
  }),

  // Backward-compatible aliases for any existing vendor UI code.
  getAll: (params = {}) => {
    const query = buildQuery(params);
    const suffix = query ? `?${query}` : '';
    return request(`/vendors${suffix}`);
  },
  getById: (id) => request(`/vendors/${id}`),
  create: (payload) => request('/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => request(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deactivate: (id) => request(`/vendors/${id}`, {
    method: 'DELETE',
  }),
  toggleStatus: (id) => request(`/vendors/${id}/status`, {
    method: 'PATCH',
  }),
};
