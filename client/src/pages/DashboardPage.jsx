import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  TrendingDown,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  follow_up: 'Follow-up',
  converted: 'Converted',
  lost: 'Lost',
};
const STATUS_COLORS = {
  new: 'bg-blue-500',
  contacted: 'bg-cyan-500',
  interested: 'bg-violet-500',
  follow_up: 'bg-amber-500',
  converted: 'bg-emerald-500',
  lost: 'bg-rose-500',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiRequest('/dashboard');
      setDashboard(response.data);
    } catch (requestError) {
      if (requestError.status === 401) logout();
      else setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    apiRequest('/dashboard')
      .then((response) => setDashboard(response.data))
      .catch((requestError) => {
        if (requestError.status === 401) logout();
        else setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [logout]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <Sidebar user={user} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={logout} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Overview
              </p>
              <h1 className="font-display text-xl font-bold tracking-tight">Pipeline dashboard</h1>
            </div>
          </div>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                Good to see you, {user.name.split(' ')[0]}
              </p>
              <h2 className="font-display mt-1 text-3xl font-bold tracking-[-0.03em] text-slate-950">
                Your pipeline, at a glance.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Numbers reflect{' '}
                {user.role === 'admin'
                  ? 'the full organization'
                  : 'leads currently assigned to you'}
                .
              </p>
            </div>
            {dashboard && (
              <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                Cache {dashboard.cache}
              </span>
            )}
          </section>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}
          {loading && !dashboard ? (
            <DashboardSkeleton />
          ) : (
            dashboard && <DashboardContent data={dashboard} />
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardContent({ data }) {
  const conversionRate = data.totalLeads
    ? Math.round((data.convertedLeads / data.totalLeads) * 100)
    : 0;
  const maxStatus = Math.max(1, ...Object.values(data.byStatus));

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BriefcaseBusiness}
          label="Total leads"
          value={data.totalLeads}
          tone="indigo"
          note="All active records"
        />
        <MetricCard
          icon={Users}
          label="New leads"
          value={data.newLeads}
          tone="blue"
          note="Awaiting first contact"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Converted"
          value={data.convertedLeads}
          tone="emerald"
          note={`${conversionRate}% conversion rate`}
        />
        <MetricCard
          icon={TrendingDown}
          label="Lost"
          value={data.lostLeads}
          tone="rose"
          note="Closed without conversion"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="panel">
          <PanelTitle
            title="Leads by status"
            subtitle="Current distribution across the sales lifecycle"
          />
          <div className="mt-8 space-y-5">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{STATUS_LABELS[status]}</span>
                  <span className="font-bold tabular-nums text-slate-950">{count}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${STATUS_COLORS[status]}`}
                    style={{ width: `${Math.max(count ? 5 : 0, (count / maxStatus) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <PanelTitle title="Ownership" subtitle="Lead volume by salesperson" />
          <div className="mt-5 divide-y divide-slate-100">
            {data.bySalesperson.length ? (
              data.bySalesperson.map((person) => (
                <div key={person.userId || 'unassigned'} className="flex items-center gap-3 py-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 font-bold text-slate-600">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{person.name}</p>
                    <p className="text-xs text-slate-400">
                      {person.userId ? 'Sales owner' : 'Needs assignment'}
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-bold tabular-nums">
                    {person.count}
                  </span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, tone, note }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <article className="panel flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="font-display mt-3 text-4xl font-bold tracking-tight text-slate-950 tabular-nums">
          {value}
        </p>
        <p className="mt-3 text-xs text-slate-400">{note}</p>
      </div>
      <div className={`rounded-xl p-3 ${tones[tone]}`}>
        <Icon size={20} />
      </div>
    </article>
  );
}

function PanelTitle({ title, subtitle }) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <UserRound className="mx-auto text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">No ownership data yet.</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-40 rounded-2xl bg-slate-200/70" />
      ))}
    </div>
  );
}

function Sidebar({ user, open, onClose, onLogout }) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#111827] text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 font-display font-bold">
              L
            </div>
            <span className="font-display text-lg font-bold">LeadFlow</span>
          </div>
          <button onClick={onClose} className="text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          <a
            className="mt-3 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-sm font-semibold"
            href="/dashboard"
          >
            <LayoutDashboard size={18} className="text-indigo-300" /> Dashboard
          </a>
          <div className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400">
            <BarChart3 size={18} /> Reports
            <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[10px]">Soon</span>
          </div>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-400/20 text-sm font-bold text-indigo-200">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-slate-400">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
