import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';
import { ErrorBox } from './LeadsPage';

const statuses = ['new', 'contacted', 'interested', 'follow_up', 'converted', 'lost'];
export default function LeadDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [target, setTarget] = useState('');
  const [edit, setEdit] = useState(null);
  async function load() {
    setError('');
    try {
      const [leadRes, historyRes] = await Promise.all([
        apiRequest(`/leads/${id}`),
        apiRequest(`/leads/${id}/activities?limit=100`),
      ]);
      setLead(leadRes.data.lead);
      setEdit({
        name: leadRes.data.lead.name,
        phone: leadRes.data.lead.phone || '',
        email: leadRes.data.lead.email || '',
        source: leadRes.data.lead.source,
      });
      setHistory(historyRes.data.activities);
      if (user.role === 'admin') {
        const userResponse = await apiRequest('/users?limit=100');
        setUsers(
          userResponse.data.users.filter(
            (candidate) => candidate.role === 'sales' && candidate.isActive,
          ),
        );
      }
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [id, user.role]);
  async function changeStatus(e) {
    try {
      const result = await apiRequest(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: e.target.value, version: lead.version }),
      });
      setLead(result.data.lead);
      load();
    } catch (err) {
      setError(err.message);
    }
  }
  async function saveLead(e) {
    e.preventDefault();
    try {
      const result = await apiRequest(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...edit,
          phone: edit.phone || null,
          email: edit.email || null,
          version: lead.version,
        }),
      });
      setLead(result.data.lead);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }
  async function assign(e) {
    e.preventDefault();
    try {
      await apiRequest(`/leads/${id}/assignment`, {
        method: 'POST',
        body: JSON.stringify({
          assignedUserId: Number(target),
          version: lead.version,
          reason: reason || undefined,
        }),
      });
      setTarget('');
      setReason('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }
  async function requestMove(e) {
    e.preventDefault();
    try {
      await apiRequest(`/leads/${id}/reassignment-requests`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setReason('');
      alert('Reassignment request sent.');
    } catch (err) {
      setError(err.message);
    }
  }
  async function addNote(e) {
    e.preventDefault();
    try {
      await apiRequest(`/leads/${id}/activities/notes`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      setNote('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <AppShell
      eyebrow="Lead record"
      title={lead?.name || 'Loading…'}
      actions={
        <Link className="btn-secondary" to="/leads">
          <ArrowLeft size={16} /> Back
        </Link>
      }
    >
      <ErrorBox message={error} />
      {lead && (
        <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
          <section className="space-y-6">
            <form className="panel" onSubmit={saveLead}>
              <h2 className="section-title">Contact details</h2>
              {edit && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <input
                    className="field"
                    required
                    minLength="2"
                    placeholder="Name"
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Phone"
                    value={edit.phone}
                    onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                  />
                  <input
                    className="field"
                    type="email"
                    placeholder="Email"
                    value={edit.email}
                    onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                  />
                  <input
                    className="field"
                    required
                    placeholder="Source"
                    value={edit.source}
                    onChange={(e) => setEdit({ ...edit, source: e.target.value })}
                  />
                </div>
              )}
              <p className="mt-4 text-sm text-slate-500">
                Owner: <strong>{lead.assignedUser?.name || 'Unassigned'}</strong>
              </p>
              <label className="mt-6 block text-sm font-semibold">
                Status
                <select className="field mt-2" value={lead.status} onChange={changeStatus}>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button className="btn-primary mt-4">Save details</button>
            </form>
            {user.role === 'admin' ? (
              <form className="panel" onSubmit={assign}>
                <h2 className="section-title">Assign lead</h2>
                <select
                  required
                  className="field mt-4"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">Choose active salesperson</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <input
                  className="field mt-3"
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button className="btn-primary mt-3">Assign</button>
              </form>
            ) : (
              <form className="panel" onSubmit={requestMove}>
                <h2 className="section-title">Request reassignment</h2>
                <textarea
                  className="field mt-4"
                  required
                  minLength="3"
                  placeholder="Explain why this lead should be reassigned"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button className="btn-primary mt-3">Send request</button>
              </form>
            )}
          </section>
          <section className="panel">
            <h2 className="section-title">Activity and notes</h2>
            <form className="mt-4 flex gap-2" onSubmit={addNote}>
              <input
                className="field"
                required
                placeholder="Add a note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn-primary">Add</button>
            </form>
            <div className="mt-6 space-y-5">
              {history.map((item) => (
                <article key={item.id} className="border-l-2 border-indigo-200 pl-4">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-semibold capitalize">
                      {item.type.replaceAll('_', ' ')}
                    </p>
                    <time className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.message || item.actor?.name || 'System activity'}
                  </p>
                </article>
              ))}
              {!history.length && (
                <p className="py-8 text-center text-sm text-slate-500">No activity yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
