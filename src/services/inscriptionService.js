import { api } from './api';

export const inscriptionService = {
  create: (data) => api.post('/inscriptions', data),
  getMy: () => api.get('/inscriptions/me'),
  getById: (id) => api.get(`/inscriptions/${id}`),
  getAll: (page = 1) => api.get(`/inscriptions?page=${page}`),
  updateStatus: (id, status) => api.patch(`/inscriptions/${id}/status`, { status }),
};
