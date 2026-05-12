import { apiFetch } from './api';

export const partsService = {
  getParts: () => apiFetch('/parts'),
  getPartById: (id) => apiFetch(`/parts/${id}`),
  createPart: (payload) => apiFetch('/parts', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updatePart: (id, payload) => apiFetch(`/parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  togglePartStatus: (id) => apiFetch(`/parts/${id}/status`, {
    method: 'PATCH',
  }),
};
