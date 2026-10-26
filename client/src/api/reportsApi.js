import api from './client';
import axios from 'axios';

export const reportsApi = {
  getReports: (params) => api.get('/reports', { params }),
  getReportById: (id) => api.get(`/reports/${id}`),
  generateReport: (data) => api.post('/reports/generate', data),
  deliverReport: (id) => api.patch(`/reports/${id}/deliver`),
  downloadReport: async (id, reportCode = 'REPORT') => {
    // Download via Axios with blob responseType to handle session credentials cleanly
    const response = await axios.get(`/api/v1/reports/${id}/download`, {
      withCredentials: true,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default reportsApi;
