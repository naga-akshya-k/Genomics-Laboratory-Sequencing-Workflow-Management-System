import api from './client';

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

export default dashboardApi;
