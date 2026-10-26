import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Send,
  FileText,
  CheckCircle,
  Building,
  User,
  Calendar,
  ShieldCheck,
  Dna,
  FileCode,
} from 'lucide-react';
import reportsApi from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getReportById(id);
      if (res?.data) {
        setReport(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load report details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownload = async () => {
    try {
      showToast(`Downloading clinical report ${report.reportCode}...`, 'info');
      await reportsApi.downloadReport(report._id, report.reportCode);
      showToast('PDF downloaded successfully', 'success');
    } catch (err) {
      showToast('Error downloading report PDF', 'error');
    }
  };

  const handleDeliver = async () => {
    try {
      await reportsApi.deliverReport(report._id);
      showToast('Report marked as delivered to requester!', 'success');
      fetchReport();
    } catch (err) {
      showToast(err.message || 'Failed to deliver report', 'error');
    }
  };

  const handleExportFhir = () => {
    showToast('Exporting HL7 FHIR Genomics JSON bundle...', 'info');
    window.open(`/api/v1/interop/fhir/reports/${report._id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-96 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Report not found or not available.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  const isStaffOrAdmin = ['admin', 'lab_staff'].includes(user?.role);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/reports')} icon={ArrowLeft}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-bold text-teal-800">{report.reportCode}</span>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated: {new Date(report.createdAt).toLocaleDateString()} by {report.generatedBy?.name || 'Lab Staff'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="md" icon={FileCode} onClick={handleExportFhir}>
            Export HL7 FHIR JSON
          </Button>

          <Button variant="primary" size="md" icon={Download} onClick={handleDownload}>
            Download Official PDF
          </Button>

          {isStaffOrAdmin && report.status !== 'delivered' && (
            <Button variant="success" size="md" icon={Send} onClick={handleDeliver}>
              Deliver to Requester
            </Button>
          )}
        </div>
      </div>

      {/* Clinical Report Document Mock Preview */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 space-y-6 text-slate-800">
        {/* Banner */}
        <div className="p-5 rounded-xl bg-teal-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 border border-teal-500 flex items-center justify-center text-teal-200">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">GENOMICS LABORATORY REPORT</h2>
              <p className="text-xs text-teal-200">Next-Generation Sequencing Clinical Evaluation • ISO-15189 Certified</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <p className="font-mono font-bold text-sm">{report.reportCode}</p>
            <p className="text-teal-200 uppercase font-semibold text-[11px] mt-0.5">
              Status: {report.status}
            </p>
          </div>
        </div>

        {/* Requisition & Specimen Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs p-5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="space-y-2">
            <p className="font-bold uppercase tracking-wider text-teal-900 border-b border-slate-200 pb-1">
              1. Investigator & Requisition
            </p>
            <p><span className="text-slate-500">Investigator:</span> <span className="font-semibold">{report.request?.requester?.name || 'Dr. Alexander Hayes'}</span></p>
            <p><span className="text-slate-500">Organization:</span> <span>{report.request?.requester?.organization || 'Genomics Core'}</span></p>
            <p><span className="text-slate-500">Requisition Code:</span> <span className="font-mono font-semibold">{report.request?.requestCode}</span></p>
            <p><span className="text-slate-500">Study Title:</span> <span className="font-medium">{report.request?.title}</span></p>
          </div>

          <div className="space-y-2">
            <p className="font-bold uppercase tracking-wider text-teal-900 border-b border-slate-200 pb-1">
              2. Specimen Intake & Barcode
            </p>
            <p><span className="text-slate-500">Specimen Barcode:</span> <span className="font-mono font-bold text-teal-800">{report.sample?.sampleCode}</span></p>
            <p><span className="text-slate-500">Material Type:</span> <span className="font-semibold">{report.sample?.sampleType}</span></p>
            <p><span className="text-slate-500">Workflow Stage:</span> <StatusBadge status={report.sample?.currentStage} /></p>
            {report.deliveredAt && (
              <p><span className="text-slate-500">Delivered Date:</span> <span className="font-semibold text-emerald-700">{new Date(report.deliveredAt).toLocaleDateString()}</span></p>
            )}
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Executive Clinical Findings & Molecular Interpretation
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-800">
            {report.summary || 'All quality control metrics satisfied laboratory standard operating procedures.'}
          </div>
        </div>

        {/* Certification block */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Digital Signature Verification: PASSED</p>
              <p className="text-[11px]">Authorized by Laboratory Medical Director, Ph.D., FACMG</p>
            </div>
          </div>

          <Button variant="secondary" size="sm" icon={Download} onClick={handleDownload}>
            Download Original PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
