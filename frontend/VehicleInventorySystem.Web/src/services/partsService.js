import { API_BASE_URL } from './api';

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

export const partsService = {
  getParts: () => request('/parts'),
  getPartById: (id) => request(`/parts/${id}`),
  createPart: (payload) => request('/parts', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updatePart: (id, payload) => request(`/parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  togglePartStatus: (id) => request(`/parts/${id}/status`, {
    method: 'PATCH',
  }),
};
