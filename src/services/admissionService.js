import { api } from './api';

export const admissionService = {
  getMy: () => api.get('/admissions/me'),
  create: (data) => api.post('/admissions', data),
  getAll: (page = 1) => api.get(`/admissions?page=${page}`),
  getById: (id) => api.get(`/admissions/${id}`),
  update: (id, data) => api.patch(`/admissions/${id}`, data),
};
