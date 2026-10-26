import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Dna, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await login(email, password);
      showToast('Welcome back! Authentication successful.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo auto-fill convenience helper for reviewer
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background genomics glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 mb-4 shadow-lg shadow-teal-950/50">
          <Dna className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Genomics Laboratory
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Sequencing Workflow & Clinical Tracking System
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <Input
                label="Work Email Address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@genomicslab.org"
                error={errors.email}
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                error={errors.password}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full mt-2"
            >
              Sign In to System
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Reviewer 1-Click Quick Fill Demo Bar */}
          <div className="mt-6 pt-5 border-t border-slate-700">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-2.5 text-center">
              Quick Demo Logins (Click to populate)
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@genomicslab.org', 'Admin123!')}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold">Admin:</span>
                  <span className="text-slate-400 text-[11px]">Dr. Eleanor Vance</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">admin</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('staff1@genomicslab.org', 'Staff123!')}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-semibold">Lab Staff:</span>
                  <span className="text-slate-400 text-[11px]">Sarah Lin, M.S.</span>
                </div>
                <span className="text-[10px] font-mono bg-teal-900/60 text-teal-300 px-1.5 py-0.5 rounded">lab_staff</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('requester1@genomicslab.org', 'Requester123!')}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-semibold">Requester:</span>
                  <span className="text-slate-400 text-[11px]">Dr. Alexander Hayes</span>
                </div>
                <span className="text-[10px] font-mono bg-sky-900/60 text-sky-300 px-1.5 py-0.5 rounded">requester</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Need an investigator account?{' '}
            <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300 underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
