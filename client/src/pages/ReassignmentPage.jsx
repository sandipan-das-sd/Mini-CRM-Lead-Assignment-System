import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';
import { ErrorBox } from './LeadsPage';

export default function ReassignmentPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [sales, setSales] = useState([]);
  const [targets, setTargets] = useState({});
  const [error, setError] = useState('');
  async function load() {
    try {
      const [a, b] = await Promise.all([
        apiRequest('/reassignment-requests?limit=100'),
        apiRequest('/users?limit=100'),
      ]);
      setRequests(a.data.requests);
      setSales(
        b.data.users.filter((candidate) => candidate.role === 'sales' && candidate.isActive),
      );
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (user.role === 'admin') load();
  }, [user.role]);
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  async function review(item, decision) {
    const assignedUserId = Number(targets[item.id] || item.requestedTo?.id) || undefined;
    try {
      await apiRequest(`/reassignment-requests/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          ...(decision === 'approved' && assignedUserId ? { assignedUserId } : {}),
        }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <AppShell eyebrow="Administration" title="Reassignment requests">
      <ErrorBox message={error} />
      <div className="space-y-4">
        {requests.map((item) => (
          <article className="panel" key={item.id}>
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="section-title">{item.lead.name}</h2>
                  <span className="badge capitalize">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Requested by {item.requestedBy.name}: {item.reason}
                </p>
              </div>
              {item.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <select
                    className="field min-w-48"
                    value={targets[item.id] || item.requestedTo?.id || ''}
                    onChange={(e) => setTargets({ ...targets, [item.id]: e.target.value })}
                  >
                    <option value="">Choose assignee</option>
                    {sales
                      .filter((s) => s.id !== item.requestedBy.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <button className="btn-primary" onClick={() => review(item, 'approved')}>
                    Approve
                  </button>
                  <button className="btn-secondary" onClick={() => review(item, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
        {!requests.length && (
          <div className="panel py-12 text-center text-sm text-slate-500">
            No reassignment requests.
          </div>
        )}
      </div>
    </AppShell>
  );
}
