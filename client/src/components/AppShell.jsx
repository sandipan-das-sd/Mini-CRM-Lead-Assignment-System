import {
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat2,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: BriefcaseBusiness },
  { to: '/users', label: 'Sales users', icon: Users, admin: true },
  { to: '/reassignments', label: 'Reassignments', icon: Repeat2, admin: true },
  { to: '/profile', label: 'My profile', icon: UserCircle },
];

export default function AppShell({ title, eyebrow, actions, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? '' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#111827] text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 font-bold">
              L
            </span>
            <span className="font-display text-lg font-bold">LeadFlow</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6">
          {links
            .filter((item) => !item.admin || user.role === 'admin')
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`
                }
              >
                <Icon size={18} /> {label}
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs capitalize text-slate-400">{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10"
          >
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-18 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 lg:hidden">
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">
                {eyebrow}
              </p>
              <h1 className="font-display text-xl font-bold">{title}</h1>
            </div>
          </div>
          {actions}
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
