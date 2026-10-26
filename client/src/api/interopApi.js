import client from './client';

export const interopApi = {
  importInstrumentData: (data) => client.post('/interop/instrument-import', data),
  getWorkflowAnalytics: () => client.get('/interop/analytics/tat'),
  getAuditLogs: (params) => client.get('/audit-logs', { params }),
  getFhirExportUrl: (reportId) => `/api/v1/interop/fhir/reports/${reportId}`,
};

export default interopApi;
