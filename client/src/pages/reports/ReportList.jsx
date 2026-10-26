import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Download, Send, Eye, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import reportsApi from '../../api/reportsApi';
import requestsApi from '../../api/requestsApi';
import samplesApi from '../../api/samplesApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';

const ReportList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  // Generate Report Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [availableSamples, setAvailableSamples] = useState([]);
  const [formData, setFormData] = useState({
    requestId: '',
    sampleId: '',
    summary:
      'All quality control metrics, sequencing coverage depth, and bioinformatic variant calls meet laboratory specifications. Somatic/germline variants verified.',
    status: 'final',
  });
  const [submitting, setSubmitting] = useState(false);

  const isStaffOrAdmin = ['admin', 'lab_staff'].includes(user?.role);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getReports({
        page,
        limit: 10,
        status,
        search,
      });
      if (res?.data) {
        setReports(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const openGenerateModal = async () => {
    setModalOpen(true);
    try {
      const [reqRes, smpRes] = await Promise.all([
        requestsApi.getRequests({ limit: 50 }),
        samplesApi.getSamples({ limit: 50 }),
      ]);
      if (reqRes?.data) {
        setAvailableRequests(reqRes.data);
        if (reqRes.data.length > 0 && !formData.requestId) {
          setFormData((p) => ({ ...p, requestId: reqRes.data[0]._id }));
        }
      }
      if (smpRes?.data) {
        setAvailableSamples(smpRes.data);
        if (smpRes.data.length > 0 && !formData.sampleId) {
          setFormData((p) => ({ ...p, sampleId: smpRes.data[0]._id }));
        }
      }
    } catch (err) {
      showToast('Failed to load requisitions or specimens', 'error');
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!formData.requestId || !formData.sampleId) {
      showToast('Please select both a requisition and specimen', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await reportsApi.generateReport(formData);
      showToast(`Report ${res.data.reportCode} generated with PDF!`, 'success');
      setModalOpen(false);
      fetchReports();
    } catch (err) {
      showToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (reportId, reportCode) => {
    try {
      showToast(`Downloading PDF for ${reportCode}...`, 'info');
      await reportsApi.downloadReport(reportId, reportCode);
      showToast('PDF downloaded successfully', 'success');
    } catch (err) {
      showToast('Error downloading report PDF', 'error');
    }
  };

  const handleDeliver = async (reportId) => {
    try {
      await reportsApi.deliverReport(reportId);
      showToast('Report marked as delivered to requester!', 'success');
      fetchReports();
    } catch (err) {
      showToast(err.message || 'Failed to deliver report', 'error');
    }
  };

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const columns = [
    {
      key: 'reportCode',
      label: 'Report Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          {val}
        </span>
      ),
    },
    {
      key: 'request',
      label: 'Requisition & Investigator',
      render: (val) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-800">{val?.requestCode}</span>
          <p className="text-xs text-slate-600 line-clamp-1">{val?.title}</p>
          <p className="text-[11px] text-slate-400">Investigator: {val?.requester?.name || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'sample',
      label: 'Specimen',
      render: (val) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800">{val?.sampleCode}</span>
          <p className="text-[11px] text-slate-500">{val?.sampleType}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Report Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      label: 'Generated Date',
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'deliveredAt',
      label: 'Delivery Date',
      render: (val) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => handleDownload(row._id, row.reportCode)}
          >
            PDF
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => navigate(`/reports/${row._id}`)}
          >
            View
          </Button>

          {isStaffOrAdmin && row.status !== 'delivered' && (
            <Button
              variant="success"
              size="sm"
              icon={Send}
              onClick={() => handleDeliver(row._id)}
            >
              Deliver
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {user?.role === 'requester' ? 'Delivered Clinical Reports' : 'Clinical Sequencing Reports'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified molecular pathology and genomics sequencing PDF reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchReports} icon={RefreshCw}>
            Refresh
          </Button>
          {isStaffOrAdmin && (
            <Button variant="primary" size="md" onClick={openGenerateModal} icon={Plus}>
              Generate Clinical Report
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      {isStaffOrAdmin && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-52">
            <Select
              placeholder="All Report Statuses"
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'final', label: 'Final (Ready for Release)' },
                { value: 'delivered', label: 'Delivered' },
              ]}
            />
          </div>

          {(status || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-xs text-rose-600 hover:text-rose-700"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Reports DataTable */}
      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        searchPlaceholder="Search report code or summary..."
        searchValue={search}
        onSearchChange={(val) => updateParam('search', val)}
        pagination={{
          page,
          pages,
          total,
          onPageChange: (newPage) => {
            const newP = new URLSearchParams(searchParams);
            newP.set('page', String(newPage));
            setSearchParams(newP);
          },
        }}
        onRowClick={(row) => navigate(`/reports/${row._id}`)}
        emptyMessage="No clinical sequencing reports found."
      />

      {/* Generate Clinical Report Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Clinical Genomics Report"
        subtitle="Build verified clinical document with PDFKit compiler"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleGenerateReport}>
              Compile & Save Report PDF
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Requisition"
              value={formData.requestId}
              onChange={(e) => setFormData((p) => ({ ...p, requestId: e.target.value }))}
              options={availableRequests.map((r) => ({
                value: r._id,
                label: `${r.requestCode} — ${r.title}`,
              }))}
              placeholder="Select requisition"
              required
            />

            <Select
              label="Specimen"
              value={formData.sampleId}
              onChange={(e) => setFormData((p) => ({ ...p, sampleId: e.target.value }))}
              options={availableSamples.map((s) => ({
                value: s._id,
                label: `${s.sampleCode} (${s.sampleType})`,
              }))}
              placeholder="Select specimen"
              required
            />
          </div>

          <Select
            label="Initial Report Status"
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            options={[
              { value: 'final', label: 'Final (Verified; ready to deliver)' },
              { value: 'draft', label: 'Draft (Internal laboratory review)' },
            ]}
          />

          <Textarea
            label="Executive Clinical Summary & Diagnostic Interpretation"
            rows={4}
            value={formData.summary}
            onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
            placeholder="Summarize analytical findings, somatic/germline variants, and diagnostic significance..."
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default ReportList;
