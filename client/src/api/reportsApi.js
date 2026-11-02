import api from './client';

export const reportsApi = {
  getReports: (params) => api.get('/reports', { params }),
  getReportById: (id) => api.get(`/reports/${id}`),
  generateReport: (data) => api.post('/reports/generate', data),
  deliverReport: (id) => api.patch(`/reports/${id}/deliver`),
  downloadReport: async (id, reportCode = 'REPORT') => {
    const blobData = await api.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });

    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
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
