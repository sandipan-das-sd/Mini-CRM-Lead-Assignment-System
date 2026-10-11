import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';
import { useApiCache } from '../hooks/useApiCache';
import { apiRequest } from '../lib/api';
import { notify } from '../lib/toast';

const blank = { name: '', phone: '', email: '', source: '' };
const statuses = ['', 'new', 'contacted', 'interested', 'follow_up', 'converted', 'lost'];

export default function LeadsPage() {
  const { user } = useAuth();
  const { get: getCached, invalidate } = useApiCache();
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [salesUsers, setSalesUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(cursor = null) {
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ limit: '25' });
    if (search.trim()) query.set('search', search.trim());
    if (status) query.set('status', status);
    if (source.trim()) query.set('source', source.trim());
    if (assignedUserId) query.set('assignedUserId', assignedUserId);
    if (createdFrom) query.set('createdFrom', createdFrom);
    if (createdTo) query.set('createdTo', `${createdTo}T23:59:59.999Z`);
    if (cursor) query.set('cursor', cursor);
    try {
      const response = await getCached(`/leads?${query}`);
      setLeads((current) => (cursor ? [...current, ...response.data.leads] : response.data.leads));
      setNextCursor(response.pagination.nextCursor);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [status]);
  useEffect(() => {
    if (user.role === 'admin') {
      getCached('/users?limit=100')
        .then((response) =>
          setSalesUsers(response.data.users.filter((item) => item.role === 'sales')),
        )
        .catch(() => {});
    }
  }, [user.role]);

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
      invalidate('/leads');
      invalidate('/dashboard');
      setForm(blank);
      setShowForm(false);
      notify('Lead created successfully.');
      await load();
    } catch (e) {
      setError(e.message);
      notify(
        e.code === 'DUPLICATE_LEAD' || e.code === 'CONTACT_CONFLICT'
          ? `Duplicate lead: ${e.message}`
          : e.message,
        'error',
      );
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
      <div className="panel mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
          <input
            className="field pl-10"
            placeholder="Search name, phone or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace('_', ' ') : 'All statuses'}
            </option>
          ))}
        </select>
        <input
          className="field"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        {user.role === 'admin' && (
          <select
            className="field"
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
          >
            <option value="">All salespeople</option>
            {salesUsers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        )}
        <label className="text-xs font-semibold text-slate-500">
          Created from
          <input
            className="field mt-1"
            type="date"
            value={createdFrom}
            onChange={(e) => setCreatedFrom(e.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Created to
          <input
            className="field mt-1"
            type="date"
            value={createdTo}
            onChange={(e) => setCreatedTo(e.target.value)}
          />
        </label>
        <button className="btn-secondary self-end" onClick={() => load()}>
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
      {nextCursor && (
        <div className="mt-5 text-center">
          <button className="btn-secondary" disabled={loading} onClick={() => load(nextCursor)}>
            Load more leads
          </button>
        </div>
      )}
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
