import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dna, Lock, Mail, User, Building, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'requester',
    organization: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Valid email is required';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization: formData.organization,
        phone: formData.phone,
      });
      showToast('Registration successful! Welcome to the Genomics Portal.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 mb-3 shadow-lg">
          <Dna className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Create Portal Account</h2>
        <p className="mt-1 text-xs text-slate-400">Register as a clinical investigator or lab member</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                icon={User}
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Jane Doe"
                error={errors.name}
                required
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                placeholder="investigator@hospital.org"
                error={errors.email}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization / Dept"
                name="organization"
                icon={Building}
                value={formData.organization}
                onChange={handleChange}
                placeholder="Dept. of Oncology"
              />
              <Input
                label="Phone Number"
                name="phone"
                icon={Phone}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1-555-0199"
              />
            </div>

            <Select
              label="Account Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: 'requester', label: 'Requester (Clinician / Investigator)' },
                { value: 'lab_staff', label: 'Lab Staff (Sequencing Specialist)' },
                { value: 'admin', label: 'Administrator (Lab Director)' },
              ]}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 6 chars"
                error={errors.password}
                required
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                icon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full mt-4"
            >
              Complete Registration
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300 underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
