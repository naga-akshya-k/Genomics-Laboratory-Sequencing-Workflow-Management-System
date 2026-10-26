import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FilePlus, Info } from 'lucide-react';
import requestsApi from '../../api/requestsApi';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';

const NewRequest = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    sampleType: 'DNA',
    priority: 'routine',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Requisition title is required';
    }
    if (!formData.sampleType) {
      errs.sampleType = 'Sample type is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await requestsApi.createRequest(formData);
      showToast('Sequencing requisition submitted successfully!', 'success');
      navigate(`/requests/${res.data._id}`);
    } catch (err) {
      showToast(err.message || 'Failed to submit requisition', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button & Page title */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => navigate('/requests')} icon={ArrowLeft}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Sequencing Requisition</h1>
          <p className="text-xs text-slate-500">Initiate a next-generation sequencing study or diagnostic assay</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <div className="space-y-5">
            {/* Title */}
            <Input
              label="Study / Requisition Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Somatic Exome Profiling for Recurrent Glioblastoma Cohort"
              error={errors.title}
              required
              helperText="Give a descriptive clinical or research project title"
            />

            {/* Sample Type & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Sample Specimen Type"
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

              <Select
                label="Requisition Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={[
                  { value: 'routine', label: 'Routine (Standard turnaround)' },
                  { value: 'urgent', label: 'Urgent (Prioritized run allocation)' },
                ]}
                required
              />
            </div>

            {/* Purpose & Clinical Objectives */}
            <Textarea
              label="Scientific Purpose & Clinical Objectives"
              name="purpose"
              rows={4}
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Describe clinical rationale, specific gene targets (e.g. TP53, EGFR), or hypothesis being investigated..."
              helperText="Provide context for laboratory analysts and bioinformatic pipelines"
            />

            {/* Information Notice */}
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-900">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Laboratory Intake Procedure</p>
                <p className="text-teal-800 mt-0.5">
                  After requisition submission, our lab staff will review study parameters and assign a barcode tracking
                  code. Physical specimen drop-off will be scheduled upon approval.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate('/requests')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} icon={Send}>
                Submit Requisition
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default NewRequest;
