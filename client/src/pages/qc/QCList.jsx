import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, Cpu, Upload } from 'lucide-react';
import qcApi from '../../api/qcApi';
import samplesApi from '../../api/samplesApi';
import interopApi from '../../api/interopApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';

const QCList = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Filter params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const result = searchParams.get('result') || '';

  // Log QC Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [availableSamples, setAvailableSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [formData, setFormData] = useState({
    sampleId: '',
    concentrationNgUl: 50.0,
    purity260_280: 1.85,
    purity260_230: 2.10,
    volumeUl: 40.0,
    integrityNumber: 8.8,
    result: 'pass',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Automated Instrument Import State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSampleId, setImportSampleId] = useState('');
  const [importInstrument, setImportInstrument] = useState('Agilent TapeStation 4200');
  const [importCsvText, setImportCsvText] = useState(
    'Parameter,Value,Unit\nConcentration,54.8,ng/uL\nA260/A280,1.86,Ratio\nA260/A230,2.14,Ratio\nVolume,35.0,uL\nDIN/RIN,9.1,Score'
  );
  const [importing, setImporting] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qcApi.getQCRecords({
        page,
        limit: 10,
        result,
      });
      if (res?.data) {
        setRecords(res.data);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load QC records', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, result, showToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openLogModal = async () => {
    setModalOpen(true);
    try {
      setLoadingSamples(true);
      const res = await samplesApi.getSamples({ limit: 50 });
      if (res?.data) {
        setAvailableSamples(res.data);
        if (res.data.length > 0 && !formData.sampleId) {
          setFormData((p) => ({ ...p, sampleId: res.data[0]._id }));
        }
      }
    } catch (err) {
      showToast('Failed to load eligible specimens for QC', 'error');
    } finally {
      setLoadingSamples(false);
    }
  };

  const openImportModal = async () => {
    setImportModalOpen(true);
    try {
      setLoadingSamples(true);
      const res = await samplesApi.getSamples({ limit: 50 });
      if (res?.data) {
        setAvailableSamples(res.data);
        if (res.data.length > 0 && !importSampleId) {
          setImportSampleId(res.data[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load eligible specimens for import', 'error');
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleInstrumentImport = async (e) => {
    e.preventDefault();
    if (!importSampleId) {
      showToast('Please select a specimen for telemetry import', 'error');
      return;
    }
    try {
      setImporting(true);
      const res = await interopApi.importInstrumentData({
        sampleId: importSampleId,
        rawCsvText: importCsvText,
        instrumentType: importInstrument,
      });
      if (res.data.success) {
        showToast(res.data.message || 'Instrument telemetry imported successfully!', 'success');
        setImportModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      showToast(err.message || 'Failed to import instrument telemetry', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleCreateQC = async (e) => {
    e.preventDefault();
    if (!formData.sampleId) {
      showToast('Please select a specimen', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await qcApi.createQCRecord(formData);
      showToast('QC assessment logged successfully!', 'success');
      setModalOpen(false);
      fetchRecords();
    } catch (err) {
      showToast(err.message || 'Failed to log QC assessment', 'error');
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
      key: 'result',
      label: 'QC Result',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'concentrationNgUl',
      label: 'Conc. (ng/µL)',
      sortable: true,
      render: (val) => <span className="font-semibold text-slate-900">{val}</span>,
    },
    {
      key: 'purity260_280',
      label: 'A260 / A280',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-slate-700">{val}</span>,
    },
    {
      key: 'purity260_230',
      label: 'A260 / A230',
      sortable: true,
      render: (val) => <span className="font-mono text-xs text-slate-700">{val}</span>,
    },
    {
      key: 'volumeUl',
      label: 'Volume (µL)',
      sortable: true,
      render: (val) => <span className="text-slate-700">{val}</span>,
    },
    {
      key: 'integrityNumber',
      label: 'RIN / DIN',
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-indigo-700">{val !== null ? val : '—'}</span>
      ),
    },
    {
      key: 'performedBy',
      label: 'Analyst',
      render: (val) => <span className="text-xs text-slate-600">{val?.name || 'Staff'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quality Control (QC) Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Spectrophotometric purity, fluorometric quantification, and TapeStation integrity records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={fetchRecords} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="outline" size="md" onClick={openImportModal} icon={FileSpreadsheet}>
            Import Instrument Output
          </Button>
          <Button variant="primary" size="md" onClick={openLogModal} icon={Plus}>
            Log Quality Control
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="w-52">
          <Select
            placeholder="All QC Outcomes"
            value={result}
            onChange={(e) => updateParam('result', e.target.value)}
            options={[
              { value: 'pass', label: 'Pass' },
              { value: 'fail', label: 'Fail' },
              { value: 'repeat', label: 'Repeat QC' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </div>

        {result && (
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

      {/* QC DataTable */}
      <DataTable
        columns={columns}
        data={records}
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
        emptyMessage="No quality control assessment records found."
      />

      {/* Log QC Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Quality Control Assessment"
        subtitle="Record fluorometric metrics and library readiness"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleCreateQC}>
              Save QC Record
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Specimen Barcode"
            value={formData.sampleId}
            onChange={(e) => setFormData((p) => ({ ...p, sampleId: e.target.value }))}
            disabled={loadingSamples}
            options={availableSamples.map((s) => ({
              value: s._id,
              label: `${s.sampleCode} (${s.sampleType}) — Stage: ${s.currentStage}`,
            }))}
            placeholder={loadingSamples ? 'Loading specimens...' : 'Select specimen'}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fluorometric Conc. (ng/µL)"
              type="number"
              step="0.1"
              value={formData.concentrationNgUl}
              onChange={(e) => setFormData((p) => ({ ...p, concentrationNgUl: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Specimen Volume (µL)"
              type="number"
              step="1"
              value={formData.volumeUl}
              onChange={(e) => setFormData((p) => ({ ...p, volumeUl: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="A260 / A280 Purity"
              type="number"
              step="0.01"
              value={formData.purity260_280}
              onChange={(e) => setFormData((p) => ({ ...p, purity260_280: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="A260 / A230 Purity"
              type="number"
              step="0.01"
              value={formData.purity260_230}
              onChange={(e) => setFormData((p) => ({ ...p, purity260_230: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="RIN / DIN Metric"
              type="number"
              step="0.1"
              value={formData.integrityNumber}
              onChange={(e) => setFormData((p) => ({ ...p, integrityNumber: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g. 8.5"
            />
          </div>

          <Select
            label="QC Evaluation Outcome"
            value={formData.result}
            onChange={(e) => setFormData((p) => ({ ...p, result: e.target.value }))}
            options={[
              { value: 'pass', label: 'Pass (Ready for Flowcell / Library Prep)' },
              { value: 'repeat', label: 'Repeat QC (Borderline yield / wash needed)' },
              { value: 'fail', label: 'Fail (Below minimum thresholds)' },
              { value: 'pending', label: 'Pending (Measurement in progress)' },
            ]}
          />

          <Textarea
            label="Analyst Notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Add observations from TapeStation gel image or Nanodrop profile..."
          />
        </div>
      </Modal>

      {/* Automated Instrument Telemetry Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Automated Instrument QC Telemetry Import"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              loading={importing}
              onClick={handleInstrumentImport}
            >
              Parse &amp; Ingest Telemetry
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Instrument Interoperability Engine:</span> Directly parses exported spectrophotometric &amp; fluorometric measurement streams. Automatically evaluates ISO-15189 Pass/Fail criteria without manual technician transcription.
            </div>
          </div>

          <Select
            label="Target Specimen Tube"
            value={importSampleId}
            onChange={(e) => setImportSampleId(e.target.value)}
            disabled={loadingSamples}
            options={availableSamples.map((s) => ({
              value: s._id,
              label: `${s.sampleCode} - ${s.sampleType} (Stage: ${s.currentStage})`,
            }))}
            required
          />

          <Select
            label="Source Laboratory Instrument"
            value={importInstrument}
            onChange={(e) => setImportInstrument(e.target.value)}
            options={[
              { value: 'Agilent TapeStation 4200', label: 'Agilent TapeStation 4200 (Automated Electrophoresis)' },
              { value: 'Thermo Qubit 4 Fluorometer', label: 'Thermo Fisher Qubit 4 (High-Sensitivity Fluorometry)' },
              { value: 'NanoDrop One Spectrophotometer', label: 'Thermo Fisher NanoDrop One (UV-Vis Microvolume)' },
            ]}
          />

          <Textarea
            label="Instrument Telemetry Stream (CSV / Tab-Delimited Output)"
            rows={6}
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            placeholder="Parameter,Value,Unit&#10;Concentration,54.8,ng/uL&#10;A260/A280,1.86,Ratio&#10;A260/A230,2.14,Ratio&#10;Volume,35.0,uL&#10;DIN/RIN,9.1,Score"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Standard: ISO-15189 Pass Threshold: RIN &ge; 7.0, A260/280 &ge; 1.70</span>
            <button
              type="button"
              onClick={() =>
                setImportCsvText(
                  'Parameter,Value,Unit\nConcentration,54.8,ng/uL\nA260/A280,1.86,Ratio\nA260/A230,2.14,Ratio\nVolume,35.0,uL\nDIN/RIN,9.1,Score'
                )
              }
              className="text-teal-600 hover:underline font-semibold"
            >
              Reset to TapeStation Preset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QCList;
