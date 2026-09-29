import { api } from './api';

export const inscriptionService = {
  create: (data) => api.post('/inscriptions', data),
  getMy: () => api.get('/inscriptions/me'),
  getAll: (page = 1, limit = 100) => api.get(`/inscriptions?page=${page}&limit=${limit}`),
};
