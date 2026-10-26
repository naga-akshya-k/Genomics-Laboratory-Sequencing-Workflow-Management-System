import api from './client';

export const requestsApi = {
  getRequests: (params) => api.get('/requests', { params }),
  getRequestById: (id) => api.get(`/requests/${id}`),
  createRequest: (data) => api.post('/requests', data),
  updateStatus: (id, data) => api.patch(`/requests/${id}/status`, data),
};

export default requestsApi;
