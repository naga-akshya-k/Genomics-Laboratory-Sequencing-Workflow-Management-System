import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Binary, RefreshCw, Upload, FileText, CheckCircle } from 'lucide-react';
import analysisApi from '../../api/analysisApi';
import samplesApi from '../../api/samplesApi';
import sequencingApi from '../../api/sequencingApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';

const AnalysisList = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  // New Analysis Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [availableSamples, setAvailableSamples] = useState([]);
  const [availableRuns, setAvailableRuns] = useState([]);
  const [formData, setFormData] = useState({
    sampleId: '',
    sequencingRunId: '',
    pipeline: 'BWA-MEM + GATK HaplotypeCaller v4.4.0',
    referenceGenome: 'GRCh38',
    status: 'completed',
    resultSummary: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analysisApi.getAnalysis({
        page,
        limit: 10,
        status,
        search,
      });
      if (res?.data) {
        setResults(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load analysis records', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, search, showToast]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const openNewModal = async () => {
    setModalOpen(true);
    try {
      const [samplesRes, runsRes] = await Promise.all([
        samplesApi.getSamples({ limit: 50 }),
        sequencingApi.getRuns({ limit: 50 }),
      ]);
      if (samplesRes?.data) {
        setAvailableSamples(samplesRes.data);
        if (samplesRes.data.length > 0 && !formData.sampleId) {
          setFormData((p) => ({ ...p, sampleId: samplesRes.data[0]._id }));
        }
      }
      if (runsRes?.data) {
        setAvailableRuns(runsRes.data);
        if (runsRes.data.length > 0 && !formData.sequencingRunId) {
          setFormData((p) => ({ ...p, sequencingRunId: runsRes.data[0]._id }));
        }
      }
    } catch (err) {
      showToast('Failed to load dependencies for analysis', 'error');
    }
  };

  const handleCreateAnalysis = async (e) => {
    e.preventDefault();
    if (!formData.sampleId) {
      showToast('Please select a specimen', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('sampleId', formData.sampleId);
      if (formData.sequencingRunId) submitData.append('sequencingRunId', formData.sequencingRunId);
      submitData.append('pipeline', formData.pipeline);
      submitData.append('referenceGenome', formData.referenceGenome);
      submitData.append('status', formData.status);
      submitData.append('resultSummary', formData.resultSummary);
      if (selectedFile) {
        submitData.append('resultFile', selectedFile);
      }

      await analysisApi.createAnalysis(submitData);
      showToast('Bioinformatics analysis recorded successfully!', 'success');
      setModalOpen(false);
      setSelectedFile(null);
      fetchAnalysis();
    } catch (err) {
      showToast(err.message || 'Failed to register analysis', 'error');
    } finally {
      setSubmitting(false);
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
      key: 'sample',
      label: 'Specimen',
      sortable: true,
      render: (val) => (
        <div>
          <Link
            to={`/samples/${val?._id}`}
            className="font-mono text-xs font-bold text-teal-700 hover:underline"
          >
            {val?.sampleCode}
          </Link>
          <p className="text-[11px] text-slate-500">{val?.sampleType}</p>
        </div>
      ),
    },
    {
      key: 'pipeline',
      label: 'Pipeline & Reference',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{val}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ref Assembly: {row.referenceGenome}</p>
        </div>
      ),
    },
    {
      key: 'sequencingRun',
      label: 'Sequencing Run',
      render: (val) => (
        <span className="font-mono text-xs text-slate-700">
          {val ? `${val.runCode} (${val.platform})` : '—'}
        </span>
      ),
    },
    {
      key: 'resultSummary',
      label: 'Executive Findings',
      render: (val) => (
        <p className="text-xs text-slate-700 max-w-sm line-clamp-2 leading-relaxed">
          {val || 'Analysis underway...'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Pipeline Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'resultFilePath',
      label: 'Artifact',
      render: (val) =>
        val ? (
          <a
            href={val}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-600 hover:text-teal-700 font-medium underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> File
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'performedBy',
      label: 'Bioinformatician',
      render: (val) => <span className="text-xs text-slate-600">{val?.name || 'Staff'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bioinformatics Analysis</h1>
          <p className="text-xs text-slate-500 mt-1">
            Secondary alignment pipelines, variant calling (GATK / DeepVariant), and clinical interpretation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchAnalysis} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="primary" size="md" onClick={openNewModal} icon={Plus}>
            Record Analysis
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-52">
          <Select
            placeholder="All Pipeline Statuses"
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            options={[
              { value: 'queued', label: 'Queued' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
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

      {/* Analysis DataTable */}
      <DataTable
        columns={columns}
        data={results}
        loading={loading}
        searchPlaceholder="Search pipeline or findings..."
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
        emptyMessage="No bioinformatics analysis records found."
      />

      {/* Register Analysis Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Bioinformatic Pipeline Result"
        subtitle="Record variant calling results and attach VCF/summary files"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleCreateAnalysis}>
              Save Findings
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Select
              label="Sequencing Run"
              value={formData.sequencingRunId}
              onChange={(e) => setFormData((p) => ({ ...p, sequencingRunId: e.target.value }))}
              options={availableRuns.map((r) => ({
                value: r._id,
                label: `${r.runCode} (${r.platform})`,
              }))}
              placeholder="Select associated run"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bioinformatics Pipeline"
              value={formData.pipeline}
              onChange={(e) => setFormData((p) => ({ ...p, pipeline: e.target.value }))}
              placeholder="e.g. BWA-MEM + GATK HaplotypeCaller"
              required
            />

            <Select
              label="Reference Genome Assembly"
              value={formData.referenceGenome}
              onChange={(e) => setFormData((p) => ({ ...p, referenceGenome: e.target.value }))}
              options={[
                { value: 'GRCh38', label: 'GRCh38 / hg38 (Primary Clinical)' },
                { value: 'GRCh37', label: 'GRCh37 / hg19 (Legacy Clinical)' },
                { value: 'T2T-CHM13', label: 'T2T-CHM13 (Telomere-to-Telomere)' },
              ]}
              required
            />
          </div>

          <Select
            label="Analysis Status"
            value={formData.status}
            onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            options={[
              { value: 'completed', label: 'Completed (Ready for Report Generation)' },
              { value: 'in_progress', label: 'In Progress (Variant Calling running)' },
              { value: 'queued', label: 'Queued (Awaiting compute cluster)' },
              { value: 'failed', label: 'Failed (Convergence abort)' },
            ]}
          />

          <Textarea
            label="Clinical Findings Summary & Pathogenic Variants"
            rows={3}
            value={formData.resultSummary}
            onChange={(e) => setFormData((p) => ({ ...p, resultSummary: e.target.value }))}
            placeholder="e.g. Pathogenic somatic frameshift in TP53 c.818G>A (p.Arg273His) confirmed at 42.1% VAF."
          />

          {/* File Upload Slot */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Upload Variant File / QC Log (Optional VCF, TSV, TXT, PDF)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Choose File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </label>
              <span className="text-xs text-slate-500">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AnalysisList;
