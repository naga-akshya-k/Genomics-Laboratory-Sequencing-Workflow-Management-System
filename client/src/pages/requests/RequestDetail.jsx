import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  User,
  Building,
  Mail,
  Calendar,
  FileSpreadsheet,
  TestTubes,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import requestsApi from '../../api/requestsApi';
import samplesApi from '../../api/samplesApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review modal state (staff/admin)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Sample registration modal state (staff/admin)
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [sampleFormData, setSampleFormData] = useState({
    sampleType: 'DNA',
    collectionDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
  });
  const [registeringSample, setRegisteringSample] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await requestsApi.getRequestById(id);
      if (res?.data) {
        setRequest(res.data);
        setNewStatus(res.data.status);
        setReviewNotes(res.data.reviewNotes || '');
        setSampleFormData((prev) => ({
          ...prev,
          sampleType: res.data.sampleType || 'DNA',
        }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to load requisition details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      await requestsApi.updateStatus(id, {
        status: newStatus,
        reviewNotes,
      });
      showToast(`Requisition marked as ${newStatus}`, 'success');
      setReviewModalOpen(false);
      fetchRequest();
    } catch (err) {
      showToast(err.message || 'Failed to update requisition status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRegisterSample = async (e) => {
    e.preventDefault();
    try {
      setRegisteringSample(true);
      const res = await samplesApi.createSample({
        requestId: id,
        sampleType: sampleFormData.sampleType,
        collectionDate: sampleFormData.collectionDate,
        receivedDate: sampleFormData.receivedDate,
      });
      showToast(`Specimen ${res.data.sampleCode} registered successfully!`, 'success');
      setSampleModalOpen(false);
      fetchRequest();
    } catch (err) {
      showToast(err.message || 'Failed to register specimen', 'error');
    } finally {
      setRegisteringSample(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Requisition not found or access denied.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/requests')}>
          Back to Requisitions
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
          <Button variant="secondary" size="sm" onClick={() => navigate('/requests')} icon={ArrowLeft}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg font-bold text-teal-800">{request.requestCode}</span>
              <StatusBadge status={request.status} />
              <StatusBadge status={request.priority} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{request.title}</h1>
          </div>
        </div>

        {isStaffOrAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              onClick={() => setReviewModalOpen(true)}
            >
              Update Review Status
            </Button>
            {['approved', 'in_progress'].includes(request.status) && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setSampleModalOpen(true)}
              >
                Register Specimen
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requisition Details & Specimen List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card title="Study Requisition Overview">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scientific Purpose & Rationale</p>
                <p className="text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                  {request.purpose || 'No scientific rationale provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Specimen Type</p>
                  <p className="font-medium text-slate-800 mt-0.5">{request.sampleType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Requisition Date</p>
                  <p className="font-medium text-slate-800 mt-0.5">{new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Registered Specimens for this Request */}
          <Card
            title={`Associated Specimens (${request.samples?.length || 0})`}
            subtitle="Biological samples registered and progressing in lab"
            action={
              isStaffOrAdmin && ['approved', 'in_progress'].includes(request.status) ? (
                <Button variant="secondary" size="sm" icon={Plus} onClick={() => setSampleModalOpen(true)}>
                  Add Specimen
                </Button>
              ) : null
            }
          >
            {request.samples?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {request.samples.map((sample) => (
                  <div
                    key={sample._id}
                    onClick={() => navigate(`/samples/${sample._id}`)}
                    className="py-3 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700">{sample.sampleCode}</span>
                        <span className="text-xs font-medium text-slate-600">({sample.sampleType})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Received: {new Date(sample.receivedDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={sample.currentStage} />
                      <Button variant="ghost" size="sm">
                        View Sample →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TestTubes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No specimens registered yet for this requisition.</p>
                {isStaffOrAdmin && request.status === 'approved' && (
                  <Button variant="primary" size="sm" className="mt-3" onClick={() => setSampleModalOpen(true)}>
                    Register First Specimen
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Reviewer Assessment & Notes */}
          {request.reviewNotes && (
            <Card title="Laboratory Reviewer Assessment">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <p className="text-slate-800 leading-relaxed italic">"{request.reviewNotes}"</p>
                {request.reviewedBy && (
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Reviewed by: {request.reviewedBy.name} ({request.reviewedBy.email})
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Requester & Workflow History */}
        <div className="space-y-6">
          {/* Investigator Card */}
          <Card title="Investigator Information">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold">{request.requester?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{request.requester?.organization || 'Genomics Facility'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{request.requester?.email || 'N/A'}</span>
              </div>
              {request.requester?.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-bold text-slate-400 shrink-0">Tel:</span>
                  <span>{request.requester.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Workflow Timeline / Audit */}
          <Card title="Activity & Audit Trail">
            <div className="relative pl-6 space-y-4 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <span className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                <p className="font-semibold text-slate-800">Requisition Submitted</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{new Date(request.createdAt).toLocaleString()}</p>
              </div>

              {request.reviewedBy && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <p className="font-semibold text-slate-800">Review Completed ({request.status})</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">By {request.reviewedBy.name}</p>
                </div>
              )}

              {request.samples?.length > 0 && (
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <p className="font-semibold text-slate-800">Specimen Intake Active</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{request.samples.length} specimen(s) logged</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal 1: Review Requisition Modal (Staff / Admin) */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review & Update Requisition Status"
        subtitle={`Audit decision for ${request.requestCode}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={updatingStatus} onClick={handleStatusUpdate}>
              Save Decision
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Decision Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved (Ready for Specimen Intake)' },
              { value: 'rejected', label: 'Rejected (Declined / Protocol Incompatible)' },
              { value: 'in_progress', label: 'In Progress (Active Laboratory Processing)' },
              { value: 'completed', label: 'Completed (All Reports Delivered)' },
            ]}
          />

          <Textarea
            label="Reviewer Clinical / Scientific Notes"
            rows={3}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add comments on eligibility, required sample yields, or reason for decision..."
          />
        </div>
      </Modal>

      {/* Modal 2: Register Specimen Modal */}
      <Modal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        title="Register Biological Specimen"
        subtitle={`Assign barcode and intake specimen for ${request.requestCode}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSampleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={registeringSample} onClick={handleRegisterSample}>
              Register Specimen
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Specimen Type"
            value={sampleFormData.sampleType}
            onChange={(e) => setSampleFormData((p) => ({ ...p, sampleType: e.target.value }))}
            options={[
              { value: 'DNA', label: 'Purified Genomic DNA' },
              { value: 'RNA', label: 'Total RNA' },
              { value: 'Blood', label: 'Whole Blood / Plasma' },
              { value: 'Tissue', label: 'Fresh Frozen / FFPE Tissue' },
              { value: 'Other', label: 'Other Biological Fluid' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Collection Date"
              type="date"
              value={sampleFormData.collectionDate}
              onChange={(e) => setSampleFormData((p) => ({ ...p, collectionDate: e.target.value }))}
            />
            <Input
              label="Received Date"
              type="date"
              value={sampleFormData.receivedDate}
              onChange={(e) => setSampleFormData((p) => ({ ...p, receivedDate: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestDetail;
