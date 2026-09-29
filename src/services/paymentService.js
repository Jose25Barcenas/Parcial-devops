import { api } from './api';

export const paymentService = {
  create: (data) => api.post('/payments', data),
  getByInscription: (inscriptionId) => api.get(`/payments/inscription/${inscriptionId}`),
  confirm: (id, transactionId) => api.patch(`/payments/${id}/confirm`, { transactionId }),
  uploadReceipt: (paymentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.uploadPatch(`/payments/${paymentId}/receipt`, formData);
  },
};
