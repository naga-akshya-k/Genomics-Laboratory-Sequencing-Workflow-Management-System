import api from './client';

export const analysisApi = {
  getAnalysis: (params) => api.get('/analysis', { params }),
  getAnalysisById: (id) => api.get(`/analysis/${id}`),
  createAnalysis: (formData) =>
    api.post('/analysis', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  updateAnalysis: (id, formData) =>
    api.patch(`/analysis/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default analysisApi;
