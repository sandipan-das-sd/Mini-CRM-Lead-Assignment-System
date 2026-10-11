import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';

const blank = { name: '', phone: '', email: '', source: '' };
const statuses = ['', 'new', 'contacted', 'interested', 'follow_up', 'converted', 'lost'];

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ limit: '100' });
    if (search.trim()) query.set('search', search.trim());
    if (status) query.set('status', status);
    try {
      setLeads((await apiRequest(`/leads?${query}`)).data.leads);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [status]);

  async function createLead(event) {
    event.preventDefault();
    setError('');
    const body = {
      name: form.name,
      source: form.source,
      phone: form.phone || null,
      email: form.email || null,
    };
    try {
      await apiRequest('/leads', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(body),
      });
      setForm(blank);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <AppShell
      eyebrow="CRM"
      title="Leads"
      actions={
        user.role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New lead
          </button>
        )
      }
    >
      {error && <ErrorBox message={error} />}
      {showForm && (
        <form onSubmit={createLead} className="panel mb-6 grid gap-4 md:grid-cols-2">
          <input
            className="field"
            required
            minLength="2"
            placeholder="Lead name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="field"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="field"
            required
            placeholder="Source (website, referral...)"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
          <div className="md:col-span-2">
            <button className="btn-primary">Create lead</button>
          </div>
        </form>
      )}
      <div className="panel mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
          <input
            className="field pl-10"
            placeholder="Search name, phone or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select
          className="field sm:max-w-52"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
        <button className="btn-secondary" onClick={load}>
          Search
        </button>
      </div>
      <div className="panel overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <Link className="font-semibold text-indigo-600" to={`/leads/${lead.id}`}>
                    {lead.name}
                  </Link>
                </td>
                <td>{lead.email || lead.phone}</td>
                <td>
                  <span className="badge">{lead.status.replace('_', ' ')}</span>
                </td>
                <td>{lead.assignedUser?.name || 'Unassigned'}</td>
                <td>{lead.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !leads.length && (
          <p className="p-10 text-center text-sm text-slate-500">No leads found.</p>
        )}
        {loading && <p className="p-10 text-center text-sm text-slate-500">Loading…</p>}
      </div>
    </AppShell>
  );
}

export function ErrorBox({ message }) {
  return message ? (
    <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      {message}
    </div>
  ) : null;
}
