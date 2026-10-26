import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Cpu, RefreshCw, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import sequencingApi from '../../api/sequencingApi';
import samplesApi from '../../api/samplesApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';

const SequencingRunList = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Filter params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';
  const platform = searchParams.get('platform') || '';

  // Schedule Run Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [availableSamples, setAvailableSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'Illumina NovaSeq',
    runType: 'WGS',
    readLength: '2x150bp',
    targetCoverage: 30,
    sampleIds: [],
    status: 'scheduled',
  });
  const [submitting, setSubmitting] = useState(false);

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [newRunStatus, setNewRunStatus] = useState('in_progress');
  const [updatingRunStatus, setUpdatingRunStatus] = useState(false);

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sequencingApi.getRuns({
        page,
        limit: 10,
        status,
        platform,
      });
      if (res?.data) {
        setRuns(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load sequencing runs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, platform, showToast]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const openScheduleModal = async () => {
    setModalOpen(true);
    try {
      setLoadingSamples(true);
      const res = await samplesApi.getSamples({ limit: 50 });
      if (res?.data) {
        setAvailableSamples(res.data);
      }
    } catch (err) {
      showToast('Failed to load eligible specimens', 'error');
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleSampleToggle = (sampleId) => {
    setFormData((prev) => {
      const exists = prev.sampleIds.includes(sampleId);
      return {
        ...prev,
        sampleIds: exists
          ? prev.sampleIds.filter((id) => id !== sampleId)
          : [...prev.sampleIds, sampleId],
      };
    });
  };

  const handleScheduleRun = async (e) => {
    e.preventDefault();
    if (formData.sampleIds.length === 0) {
      showToast('Please select at least one specimen to batch into the run', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await sequencingApi.createRun(formData);
      showToast('Sequencing run scheduled successfully!', 'success');
      setModalOpen(false);
      setFormData({
        platform: 'Illumina NovaSeq',
        runType: 'WGS',
        readLength: '2x150bp',
        targetCoverage: 30,
        sampleIds: [],
        status: 'scheduled',
      });
      fetchRuns();
    } catch (err) {
      showToast(err.message || 'Failed to schedule run', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (run) => {
    setSelectedRun(run);
    setNewRunStatus(run.status);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRun) return;
    try {
      setUpdatingRunStatus(true);
      await sequencingApi.updateRun(selectedRun._id, { status: newRunStatus });
      showToast(`Run status updated to ${newRunStatus}`, 'success');
      setStatusModalOpen(false);
      fetchRuns();
    } catch (err) {
      showToast(err.message || 'Failed to update run status', 'error');
    } finally {
      setUpdatingRunStatus(false);
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
      key: 'runCode',
      label: 'Run Code',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          {val}
        </span>
      ),
    },
    {
      key: 'platform',
      label: 'Platform & Assay',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{val}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {row.runType} • {row.readLength} ({row.targetCoverage}x)
          </p>
        </div>
      ),
    },
    {
      key: 'samples',
      label: 'Batched Specimens',
      render: (val) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {val && val.length > 0 ? (
            val.map((s) => (
              <span
                key={s._id}
                className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
              >
                {s.sampleCode}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Run Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'performedBy',
      label: 'Sequencing Specialist',
      render: (val) => <span className="text-xs text-slate-600">{val?.name || 'Staff'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Button variant="secondary" size="sm" onClick={() => openStatusModal(row)}>
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sequencing Flowcell Runs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cluster generation, flowcell chemistry, sequencing instrument status, and batch monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchRuns} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="primary" size="md" onClick={openScheduleModal} icon={Plus}>
            Schedule Sequencing Run
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-52">
          <Select
            placeholder="All Platforms"
            value={platform}
            onChange={(e) => updateParam('platform', e.target.value)}
            options={[
              { value: 'Illumina NovaSeq', label: 'Illumina NovaSeq' },
              { value: 'Illumina MiSeq', label: 'Illumina MiSeq' },
              { value: 'Oxford Nanopore', label: 'Oxford Nanopore' },
              { value: 'PacBio', label: 'PacBio' },
            ]}
          />
        </div>

        <div className="w-48">
          <Select
            placeholder="All Statuses"
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
        </div>

        {(platform || status) && (
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

      {/* Runs DataTable */}
      <DataTable
        columns={columns}
        data={runs}
        loading={loading}
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
        emptyMessage="No sequencing flowcell runs found."
      />

      {/* Schedule Sequencing Run Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Sequencing Flowcell Run"
        subtitle="Batch specimens and configure NGS instrument parameters"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleScheduleRun}>
              Initialize Run
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Instrument Platform"
              value={formData.platform}
              onChange={(e) => setFormData((p) => ({ ...p, platform: e.target.value }))}
              options={[
                { value: 'Illumina NovaSeq', label: 'Illumina NovaSeq 6000' },
                { value: 'Illumina MiSeq', label: 'Illumina MiSeq Dx' },
                { value: 'Oxford Nanopore', label: 'Oxford Nanopore PromethION' },
                { value: 'PacBio', label: 'PacBio Revio (HiFi Long-Reads)' },
              ]}
              required
            />

            <Select
              label="Sequencing Assay / Application"
              value={formData.runType}
              onChange={(e) => setFormData((p) => ({ ...p, runType: e.target.value }))}
              options={[
                { value: 'WGS', label: 'Whole Genome Sequencing (WGS)' },
                { value: 'WES', label: 'Whole Exome Sequencing (WES)' },
                { value: 'RNA-Seq', label: 'RNA-Seq Transcriptomics' },
                { value: 'Targeted Panel', label: 'Targeted Deep Gene Panel' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Read Length / Chemistry"
              value={formData.readLength}
              onChange={(e) => setFormData((p) => ({ ...p, readLength: e.target.value }))}
              placeholder="e.g. 2x150bp"
              required
            />

            <Input
              label="Target Depth / Coverage (x)"
              type="number"
              value={formData.targetCoverage}
              onChange={(e) => setFormData((p) => ({ ...p, targetCoverage: parseInt(e.target.value, 10) || 0 }))}
              required
            />
          </div>

          {/* Batch Specimen Multi-Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Select Specimens for Batch ({formData.sampleIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 bg-slate-50/50">
              {loadingSamples ? (
                <p className="text-xs text-slate-400 p-4 text-center">Loading specimens...</p>
              ) : availableSamples.length > 0 ? (
                availableSamples.map((sample) => {
                  const isSelected = formData.sampleIds.includes(sample._id);
                  return (
                    <div
                      key={sample._id}
                      onClick={() => handleSampleToggle(sample._id)}
                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50 border border-teal-300' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 pointer-events-none"
                        />
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-800">{sample.sampleCode}</span>
                          <span className="text-xs text-slate-500 ml-1.5">({sample.sampleType})</span>
                        </div>
                      </div>
                      <StatusBadge status={sample.currentStage} />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 p-4 text-center">No specimens available.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Update Run Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Run Status"
        subtitle={`Modify instrument status for ${selectedRun?.runCode}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={updatingRunStatus} onClick={handleUpdateStatus}>
              Save Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Instrument Execution Status"
            value={newRunStatus}
            onChange={(e) => setNewRunStatus(e.target.value)}
            options={[
              { value: 'scheduled', label: 'Scheduled (Flowcell mounted)' },
              { value: 'in_progress', label: 'In Progress (Sequencing chemistry running)' },
              { value: 'completed', label: 'Completed (Basecalling complete; advance to analysis)' },
              { value: 'failed', label: 'Failed (Flowcell fluidics or optics abort)' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SequencingRunList;
