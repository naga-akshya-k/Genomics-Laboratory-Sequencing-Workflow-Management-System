import api from './client';

export const qcApi = {
  getQCRecords: (params) => api.get('/qc', { params }),
  getQCById: (id) => api.get(`/qc/${id}`),
  createQCRecord: (data) => api.post('/qc', data),
  updateQCRecord: (id, data) => api.patch(`/qc/${id}`, data),
};

export default qcApi;
