import api from './client';

export const sequencingApi = {
  getRuns: (params) => api.get('/sequencing-runs', { params }),
  getRunById: (id) => api.get(`/sequencing-runs/${id}`),
  createRun: (data) => api.post('/sequencing-runs', data),
  updateRun: (id, data) => api.patch(`/sequencing-runs/${id}`, data),
};

export default sequencingApi;
