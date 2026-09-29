import { api } from './api';

export const admissionService = {
  getMy: () => api.get('/admissions/me'),
  create: (data) => api.post('/admissions', data),
  getAll: (page = 1, limit = 100) => api.get(`/admissions?page=${page}&limit=${limit}`),
  update: (id, data) => api.patch(`/admissions/${id}`, data),
};
