import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';
import { useApiCache } from '../hooks/useApiCache';
import { apiRequest } from '../lib/api';
import { notify } from '../lib/toast';
import { ErrorBox } from './LeadsPage';

export default function UsersPage() {
  const { user: actor } = useAuth();
  const { get: getCached, invalidate } = useApiCache();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  async function load() {
    try {
      setUsers((await getCached('/users?limit=100')).data.users);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (actor.role === 'admin') load();
  }, [actor.role]);
  if (actor.role !== 'admin') return <Navigate to="/dashboard" replace />;
  async function create(e) {
    e.preventDefault();
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify(form) });
      invalidate('/users');
      setForm({ name: '', email: '', password: '' });
      setOpen(false);
      notify('Salesperson created successfully.');
      load();
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
    }
  }
  async function toggle(item) {
    try {
      await apiRequest(`/users/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      invalidate('/users');
      notify(`${item.name} ${item.isActive ? 'deactivated' : 'activated'}.`);
      load();
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
    }
  }
  return (
    <AppShell
      eyebrow="Administration"
      title="Sales users"
      actions={
        <button className="btn-primary" onClick={() => setOpen(!open)}>
          <Plus size={16} /> Add user
        </button>
      }
    >
      <ErrorBox message={error} />
      {open && (
        <form className="panel mb-6 grid gap-4 md:grid-cols-3" onSubmit={create}>
          <input
            className="field"
            required
            minLength="2"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="field"
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="field"
            required
            minLength="12"
            type="password"
            placeholder="Temporary password (12+ chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="btn-primary md:col-span-3 md:w-fit">Create sales user</button>
        </form>
      )}
      <div className="panel overflow-x-auto p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td className="font-semibold">{item.name}</td>
                <td>{item.email}</td>
                <td className="capitalize">{item.role}</td>
                <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    disabled={item.id === actor.id}
                    className="btn-secondary"
                    onClick={() => toggle(item)}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
