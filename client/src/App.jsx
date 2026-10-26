import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import RequestList from './pages/requests/RequestList';
import RequestDetail from './pages/requests/RequestDetail';
import NewRequest from './pages/requests/NewRequest';
import SampleList from './pages/samples/SampleList';
import SampleDetail from './pages/samples/SampleDetail';
import RegisterSample from './pages/samples/RegisterSample';
import QCList from './pages/qc/QCList';
import SequencingRunList from './pages/sequencing/SequencingRunList';
import AnalysisList from './pages/analysis/AnalysisList';
import ReportList from './pages/reports/ReportList';
import ReportDetail from './pages/reports/ReportDetail';
import UserManagement from './pages/admin/UserManagement';
import WorkflowAnalytics from './pages/admin/WorkflowAnalytics';
import AuditTrail from './pages/admin/AuditTrail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Requisitions */}
            <Route path="/requests" element={<RequestList />} />
            <Route path="/requests/new" element={<NewRequest />} />
            <Route path="/requests/:id" element={<RequestDetail />} />

            {/* Specimens */}
            <Route path="/samples" element={<SampleList />} />
            <Route
              path="/samples/register"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_staff']}>
                  <RegisterSample />
                </ProtectedRoute>
              }
            />
            <Route path="/samples/:id" element={<SampleDetail />} />

            {/* Quality Control (Staff/Admin) */}
            <Route
              path="/qc"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_staff']}>
                  <QCList />
                </ProtectedRoute>
              }
            />

            {/* Sequencing Runs (Staff/Admin) */}
            <Route
              path="/sequencing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_staff']}>
                  <SequencingRunList />
                </ProtectedRoute>
              }
            />

            {/* Bioinformatics Analysis (Staff/Admin) */}
            <Route
              path="/analysis"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_staff']}>
                  <AnalysisList />
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route path="/reports" element={<ReportList />} />
            <Route path="/reports/:id" element={<ReportDetail />} />

            {/* Turnaround Time & SLA Analytics (Admin & Staff) */}
            <Route
              path="/analytics/tat"
              element={
                <ProtectedRoute allowedRoles={['admin', 'lab_staff']}>
                  <WorkflowAnalytics />
                </ProtectedRoute>
              }
            />

            {/* System Admin: User Management & Audit Trail */}
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditTrail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
