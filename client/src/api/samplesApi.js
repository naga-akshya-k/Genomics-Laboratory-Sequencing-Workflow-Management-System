import api from './client';

export const samplesApi = {
  getSamples: (params) => api.get('/samples', { params }),
  getSampleById: (id) => api.get(`/samples/${id}`),
  createSample: (data) => api.post('/samples', data),
  updateStage: (id, stage) => api.patch(`/samples/${id}/stage`, { currentStage: stage }),
};

export default samplesApi;
