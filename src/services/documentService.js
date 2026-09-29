import { api } from './api';

export const documentService = {
  upload: (inscriptionId, docType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('inscriptionId', inscriptionId);
    formData.append('docType', docType);
    return api.upload('/documents/upload', formData);
  },
  getByInscription: (inscriptionId) => api.get(`/documents/${inscriptionId}`),
};
