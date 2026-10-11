import { useState } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f3ef] p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:min-h-[calc(100vh-48px)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#111827] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <Brand light />
          <div className="relative max-w-lg">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">
              Built for accountable growth
            </p>
            <h1 className="font-display text-5xl leading-[1.08] tracking-[-0.04em]">
              Every lead has an owner. Every action has a history.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              A focused workspace for sales teams to move faster without losing context, ownership,
              or trust.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            <Feature
              icon={ShieldCheck}
              title="Controlled access"
              text="Role-aware views and secure ownership."
            />
            <Feature
              icon={BarChart3}
              title="Clear momentum"
              text="Live pipeline signals at a glance."
            />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-12 lg:hidden">
              <Brand />
            </div>
            <p className="text-sm font-semibold text-indigo-600">Welcome back</p>
            <h2 className="font-display mt-2 text-4xl tracking-[-0.035em] text-slate-950">
              Sign in to LeadFlow
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use the email and password provided by your administrator.
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Work email
                <input
                  className="field mt-2"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <span className="relative mt-2 block">
                  <input
                    className="field pr-12"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? 'Signing in…' : 'Sign in securely'}
                {!submitting && <ArrowRight size={17} />}
              </button>
            </form>
            <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={16} />
              <span>
                Your session uses short-lived access tokens and immediate account-revocation checks.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand({ light = false }) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-display text-lg font-bold text-white shadow-lg shadow-indigo-950/30">
        L
      </div>
      <div>
        <div
          className={`font-display text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-slate-950'}`}
        >
          LeadFlow
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          CRM workspace
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <Icon size={20} className="text-indigo-300" />
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}
