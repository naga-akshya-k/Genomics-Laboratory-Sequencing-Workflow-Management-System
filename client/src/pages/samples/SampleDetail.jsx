import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Cpu,
  Binary,
  FileText,
  Plus,
  Download,
  Calendar,
  User,
  Building,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Send,
} from 'lucide-react';
import samplesApi from '../../api/samplesApi';
import qcApi from '../../api/qcApi';
import reportsApi from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import StageTimeline from '../../components/StageTimeline';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';

const SampleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stage change modal state
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  // QC modal state
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcForm, setQcForm] = useState({
    concentrationNgUl: 50.0,
    purity260_280: 1.85,
    purity260_230: 2.10,
    volumeUl: 40.0,
    integrityNumber: 8.5,
    result: 'pass',
    notes: '',
  });
  const [submittingQc, setSubmittingQc] = useState(false);

  const fetchSample = useCallback(async () => {
    try {
      setLoading(true);
      const res = await samplesApi.getSampleById(id);
      if (res?.data) {
        setSample(res.data);
        setSelectedStage(res.data.currentStage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load specimen traceability data', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchSample();
  }, [fetchSample]);

  const handleStageUpdate = async () => {
    try {
      setUpdatingStage(true);
      await samplesApi.updateStage(id, selectedStage);
      showToast(`Specimen advanced to stage: ${selectedStage}`, 'success');
      setStageModalOpen(false);
      fetchSample();
    } catch (err) {
      showToast(err.message || 'Failed to advance stage', 'error');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleCreateQc = async (e) => {
    e.preventDefault();
    try {
      setSubmittingQc(true);
      await qcApi.createQCRecord({
        sampleId: id,
        ...qcForm,
      });
      showToast('Quality Control metric logged successfully', 'success');
      setQcModalOpen(false);
      fetchSample();
    } catch (err) {
      showToast(err.message || 'Failed to record QC', 'error');
    } finally {
      setSubmittingQc(false);
    }
  };

  const handleDownloadPdf = async (reportId, reportCode) => {
    try {
      showToast(`Downloading clinical report ${reportCode}...`, 'info');
      await reportsApi.downloadReport(reportId, reportCode);
      showToast('Report download complete', 'success');
    } catch (err) {
      showToast('Error downloading report', 'error');
    }
  };

  const handleDeliverReport = async (reportId) => {
    try {
      await reportsApi.deliverReport(reportId);
      showToast('Report marked as delivered to requester!', 'success');
      fetchSample();
    } catch (err) {
      showToast(err.message || 'Failed to deliver report', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-40 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Specimen not found or access denied.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/samples')}>
          Back to Specimens
        </Button>
      </div>
    );
  }

  const isStaffOrAdmin = ['admin', 'lab_staff'].includes(user?.role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/samples')} icon={ArrowLeft}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-bold text-slate-900">{sample.sampleCode}</span>
              <StatusBadge status={sample.currentStage} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Material: <span className="font-semibold text-slate-700">{sample.sampleType}</span> • Requisition:{' '}
              <Link to={`/requests/${sample.request?._id}`} className="font-mono text-teal-700 hover:underline">
                {sample.request?.requestCode}
              </Link>
            </p>
          </div>
        </div>

        {isStaffOrAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCw}
              onClick={() => setStageModalOpen(true)}
            >
              Advance Stage
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Activity}
              onClick={() => setQcModalOpen(true)}
            >
              Log QC Metric
            </Button>
          </div>
        )}
      </div>

      {/* Stage Timeline */}
      <Card title="Specimen Analytical Lifecycle Tracking" className="bg-slate-50/50">
        <StageTimeline currentStage={sample.currentStage} />
      </Card>

      {/* Main Grid: Specimen Overview & Parent Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Specimen Metadata" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Barcode Identifier</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{sample.sampleCode}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Material Type</p>
              <p className="font-medium text-slate-800 mt-0.5">{sample.sampleType}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Intake Staff</p>
              <p className="font-medium text-slate-800 mt-0.5">{sample.registeredBy?.name || 'Lab Staff'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collection Date</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {sample.collectionDate ? new Date(sample.collectionDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lab Received Date</p>
              <p className="font-medium text-slate-800 mt-0.5">
                {sample.receivedDate ? new Date(sample.receivedDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Phase</p>
              <p className="mt-0.5"><StatusBadge status={sample.currentStage} /></p>
            </div>
          </div>
        </Card>

        {/* Parent Requisition Summary */}
        <Card title="Parent Requisition">
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-mono font-bold text-teal-700">{sample.request?.requestCode}</span>
              <p className="font-medium text-slate-800 mt-0.5 text-sm">{sample.request?.title}</p>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{sample.request?.requester?.name || 'Investigator'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{sample.request?.requester?.organization || 'Hospital/Institution'}</span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate(`/requests/${sample.request?._id}`)}
              >
                View Full Requisition
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Traceability Module 1: Quality Control (QC) Records */}
      <Card
        title={`1. Quality Control Assessment (${sample.qcRecords?.length || 0})`}
        subtitle="Fluorometric quantification and spectrophotometric purity"
        action={
          isStaffOrAdmin && (
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => setQcModalOpen(true)}>
              Record QC
            </Button>
          )
        }
      >
        {sample.qcRecords?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 pb-2">
                <tr>
                  <th className="pb-2">Result</th>
                  <th className="pb-2">Conc. (ng/µL)</th>
                  <th className="pb-2">A260/280</th>
                  <th className="pb-2">A260/230</th>
                  <th className="pb-2">Vol (µL)</th>
                  <th className="pb-2">RIN/DIN</th>
                  <th className="pb-2">Analyst</th>
                  <th className="pb-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sample.qcRecords.map((qc) => (
                  <tr key={qc._id} className="hover:bg-slate-50/50">
                    <td className="py-2.5">
                      <StatusBadge status={qc.result} />
                    </td>
                    <td className="py-2.5 font-semibold text-slate-900">{qc.concentrationNgUl}</td>
                    <td className="py-2.5 font-medium text-slate-700">{qc.purity260_280}</td>
                    <td className="py-2.5 font-medium text-slate-700">{qc.purity260_230}</td>
                    <td className="py-2.5 text-slate-700">{qc.volumeUl}</td>
                    <td className="py-2.5 font-semibold text-indigo-700">{qc.integrityNumber ?? '—'}</td>
                    <td className="py-2.5 text-slate-600">{qc.performedBy?.name || 'Lab Staff'}</td>
                    <td className="py-2.5 text-slate-500 italic max-w-xs truncate">{qc.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No quality control records logged yet.</p>
        )}
      </Card>

      {/* Traceability Module 2: Sequencing Runs */}
      <Card
        title={`2. Sequencing Execution (${sample.sequencingRuns?.length || 0})`}
        subtitle="Flowcell batch allocation and instrument runs"
        action={
          isStaffOrAdmin && (
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => navigate('/sequencing')}>
              Assign to Run
            </Button>
          )
        }
      >
        {sample.sequencingRuns?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sample.sequencingRuns.map((run) => (
              <div key={run._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{run.runCode}</span>
                    <span className="font-medium text-slate-800">
                      {run.platform} • {run.runType} ({run.targetCoverage}x)
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="text-slate-500 mt-1">
                    Read Length: {run.readLength} • Performed by: {run.performedBy?.name || 'Staff'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/sequencing')}>
                  View Runs
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">Specimen has not yet been batched into a sequencing run.</p>
        )}
      </Card>

      {/* Traceability Module 3: Bioinformatics Analysis */}
      <Card
        title={`3. Bioinformatics Analysis (${sample.analysisResults?.length || 0})`}
        subtitle="Alignment pipelines and somatic/germline variant calling"
        action={
          isStaffOrAdmin && (
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => navigate('/analysis')}>
              Add Analysis
            </Button>
          )
        }
      >
        {sample.analysisResults?.length > 0 ? (
          <div className="space-y-3">
            {sample.analysisResults.map((analysis) => (
              <div key={analysis._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{analysis.pipeline}</span>
                    <span className="text-slate-500">({analysis.referenceGenome})</span>
                  </div>
                  <StatusBadge status={analysis.status} />
                </div>
                <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                  {analysis.resultSummary || 'No variant summary recorded.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No bioinformatic analysis records for this specimen yet.</p>
        )}
      </Card>

      {/* Traceability Module 4: Generated Reports */}
      <Card
        title={`4. Clinical Sequencing Reports (${sample.reports?.length || 0})`}
        subtitle="Server-generated verified clinical PDF deliverables"
        action={
          isStaffOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => navigate(`/reports?sampleId=${sample._id}`)}
            >
              Generate Report
            </Button>
          )
        }
      >
        {sample.reports?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sample.reports.map((rep) => (
              <div key={rep._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{rep.reportCode}</span>
                    <StatusBadge status={rep.status} />
                    {rep.deliveredAt && (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Delivered on {new Date(rep.deliveredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-1">{rep.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownloadPdf(rep._id, rep.reportCode)}
                  >
                    Download PDF
                  </Button>

                  {isStaffOrAdmin && rep.status !== 'delivered' && (
                    <Button
                      variant="success"
                      size="sm"
                      icon={Send}
                      onClick={() => handleDeliverReport(rep._id)}
                    >
                      Deliver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No clinical report generated for this specimen yet.</p>
        )}
      </Card>

      {/* Modal 1: Stage Advancement Modal */}
      <Modal
        isOpen={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        title="Advance Specimen Workflow Stage"
        subtitle={`Update processing stage for ${sample.sampleCode}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStageModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={updatingStage} onClick={handleStageUpdate}>
              Update Stage
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Target Workflow Stage"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            options={[
              { value: 'registered', label: '1. Registered (Specimen Intake)' },
              { value: 'qc', label: '2. QC (Quality Control Assessment)' },
              { value: 'sequencing', label: '3. Sequencing (Flowcell Run in Progress)' },
              { value: 'analysis', label: '4. Analysis (Bioinformatic Pipeline)' },
              { value: 'report_ready', label: '5. Report Ready (Findings Finalized)' },
              { value: 'delivered', label: '6. Delivered (Released to Investigator)' },
            ]}
          />
        </div>
      </Modal>

      {/* Modal 2: Log QC Record Modal */}
      <Modal
        isOpen={qcModalOpen}
        onClose={() => setQcModalOpen(false)}
        title="Log Quality Control (QC) Assessment"
        subtitle={`Record Qubit fluorometer and TapeStation metrics for ${sample.sampleCode}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setQcModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submittingQc} onClick={handleCreateQc}>
              Save QC Record
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Concentration (ng/µL)"
              type="number"
              step="0.1"
              value={qcForm.concentrationNgUl}
              onChange={(e) => setQcForm((p) => ({ ...p, concentrationNgUl: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="Volume (µL)"
              type="number"
              step="1"
              value={qcForm.volumeUl}
              onChange={(e) => setQcForm((p) => ({ ...p, volumeUl: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="A260 / A280 Purity"
              type="number"
              step="0.01"
              value={qcForm.purity260_280}
              onChange={(e) => setQcForm((p) => ({ ...p, purity260_280: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="A260 / A230 Purity"
              type="number"
              step="0.01"
              value={qcForm.purity260_230}
              onChange={(e) => setQcForm((p) => ({ ...p, purity260_230: parseFloat(e.target.value) || 0 }))}
              required
            />
            <Input
              label="RIN / DIN Integrity"
              type="number"
              step="0.1"
              value={qcForm.integrityNumber}
              onChange={(e) => setQcForm((p) => ({ ...p, integrityNumber: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g. 8.5"
            />
          </div>

          <Select
            label="Quality Assessment Result"
            value={qcForm.result}
            onChange={(e) => setQcForm((p) => ({ ...p, result: e.target.value }))}
            options={[
              { value: 'pass', label: 'Pass (Proceed to Library Prep & Sequencing)' },
              { value: 'repeat', label: 'Repeat QC (Borderline yield / wash needed)' },
              { value: 'fail', label: 'Fail (Degraded / Insufficient Material)' },
              { value: 'pending', label: 'Pending (In Progress)' },
            ]}
          />

          <Textarea
            label="Technician Notes"
            rows={2}
            value={qcForm.notes}
            onChange={(e) => setQcForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="e.g. High molecular weight band confirmed; optimal library yield expected."
          />
        </div>
      </Modal>
    </div>
  );
};

export default SampleDetail;
