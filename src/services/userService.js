import { api } from './api';

export const userService = {
  getAll: (page = 1, limit = 100) => api.get(`/users?page=${page}&limit=${limit}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};
