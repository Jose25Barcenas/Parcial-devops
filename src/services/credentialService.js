import { api } from './api';

export const credentialService = {
  // Admin
  getAll: (page = 1, limit = 10, type = '') =>
    api.get(`/credentials?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
  issue: (data) => api.post('/credentials/issue', data),
  revoke: (id, reason) => api.post(`/credentials/${id}/revoke`, { reason }),
  getById: (id) => api.get(`/credentials/${id}`),

  // Ledger
  ledgerStatus: () => api.get('/credentials/ledger/status'),
  ledgerBlocks: (limit = 50) => api.get(`/credentials/ledger/blocks?limit=${limit}`),
  validateChain: () => api.get('/credentials/ledger/validate'),

  // Propias del aspirante
  getMine: () => api.get('/credentials/me'),

  // Verificacion PUBLICA (sin token) - la usa el QR
  verifyPublic: async (code) => {
    const res = await fetch(`/api/v1/credentials/verify/${encodeURIComponent(code)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.message || 'Credencial no encontrada');
      e.status = res.status;
      throw e;
    }
    return res.json();
  },
};
