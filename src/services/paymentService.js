import { api } from './api';

export const paymentService = {
  create: (data) => api.post('/payments', data),
  getById: (id) => api.get(`/payments/${id}`),
  confirm: (id, transactionId) => api.patch(`/payments/${id}/confirm`, { transactionId }),
  uploadReceipt: (paymentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload(`/payments/${paymentId}/receipt`, formData);
  },
};
