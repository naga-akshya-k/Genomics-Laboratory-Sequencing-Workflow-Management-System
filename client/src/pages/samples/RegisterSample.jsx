import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, TestTubes, Info } from 'lucide-react';
import requestsApi from '../../api/requestsApi';
import samplesApi from '../../api/samplesApi';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';

const RegisterSample = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const preselectedRequestId = searchParams.get('requestId') || '';

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [formData, setFormData] = useState({
    requestId: preselectedRequestId,
    sampleType: 'DNA',
    collectionDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    currentStage: 'registered',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoadingRequests(true);
        // Fetch approved or in_progress requisitions that can accept specimens
        const res = await requestsApi.getRequests({ limit: 50 });
        if (res?.data) {
          setRequests(res.data);
          if (preselectedRequestId) {
            const found = res.data.find((r) => r._id === preselectedRequestId);
            if (found) {
              setFormData((prev) => ({
                ...prev,
                sampleType: found.sampleType || 'DNA',
              }));
            }
          }
        }
      } catch (err) {
        showToast('Failed to load eligible requisitions', 'error');
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, [preselectedRequestId, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If changing request, update default sample type to match request's sampleType
    if (name === 'requestId') {
      const match = requests.find((r) => r._id === value);
      if (match?.sampleType) {
        setFormData((prev) => ({ ...prev, sampleType: match.sampleType }));
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.requestId) {
      errs.requestId = 'Parent requisition is required to register a specimen';
    }
    if (!formData.sampleType) {
      errs.sampleType = 'Specimen type is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await samplesApi.createSample(formData);
      showToast(`Specimen ${res.data.sampleCode} registered successfully!`, 'success');
      navigate(`/samples/${res.data._id}`);
    } catch (err) {
      showToast(err.message || 'Failed to register specimen', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate('/samples')} icon={ArrowLeft}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Biological Specimen</h1>
          <p className="text-xs text-slate-500">Specimen intake, barcode assignment, and laboratory registry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <div className="space-y-5">
            {/* Parent Requisition Selector */}
            <Select
              label="Parent Clinical Requisition"
              name="requestId"
              value={formData.requestId}
              onChange={handleChange}
              disabled={loadingRequests}
              options={requests.map((r) => ({
                value: r._id,
                label: `${r.requestCode} — ${r.title} (${r.status.toUpperCase()})`,
              }))}
              placeholder={loadingRequests ? 'Loading requisitions...' : 'Select associated requisition'}
              error={errors.requestId}
              required
              helperText="Specimen barcodes are formally attached to approved study requisitions"
            />

            {/* Specimen Type */}
            <Select
              label="Specimen Material Type"
              name="sampleType"
              value={formData.sampleType}
              onChange={handleChange}
              options={[
                { value: 'DNA', label: 'Purified Genomic DNA' },
                { value: 'RNA', label: 'Total RNA' },
                { value: 'Blood', label: 'Whole Blood / Plasma (cfDNA)' },
                { value: 'Tissue', label: 'Fresh Frozen / FFPE Tissue' },
                { value: 'Other', label: 'Other Biological Fluid' },
              ]}
              error={errors.sampleType}
              required
            />

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Collection Date"
                name="collectionDate"
                type="date"
                value={formData.collectionDate}
                onChange={handleChange}
                required
              />

              <Input
                label="Received at Core Lab Date"
                name="receivedDate"
                type="date"
                value={formData.receivedDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Intake notice */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Sequential Barcode Generation</p>
                <p className="mt-0.5">
                  The system will automatically allocate the next unique specimen barcode (e.g. SMP-2026-XXXX).
                  Once registered, the sample will be eligible for fluorometric QC assessment.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate('/samples')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} icon={Save}>
                Register Specimen
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default RegisterSample;
