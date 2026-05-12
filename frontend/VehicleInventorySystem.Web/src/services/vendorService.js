import { apiFetch } from './api';

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
    return apiFetch(`/vendors${suffix}`);
  },
  getVendorById: (id) => apiFetch(`/vendors/${id}`),
  createVendor: (payload) => apiFetch('/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateVendor: (id, payload) => apiFetch(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deactivateVendor: (id) => apiFetch(`/vendors/${id}`, {
    method: 'DELETE',
  }),
  toggleVendorStatus: (id) => apiFetch(`/vendors/${id}/status`, {
    method: 'PATCH',
  }),
  getAll: (params = {}) => {
    const query = buildQuery(params);
    const suffix = query ? `?${query}` : '';
    return apiFetch(`/vendors${suffix}`);
  },
  getById: (id) => apiFetch(`/vendors/${id}`),
  create: (payload) => apiFetch('/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  update: (id, payload) => apiFetch(`/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deactivate: (id) => apiFetch(`/vendors/${id}`, {
    method: 'DELETE',
  }),
  toggleStatus: (id) => apiFetch(`/vendors/${id}/status`, {
    method: 'PATCH',
  }),
};
