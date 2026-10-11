import { BadgeCheck, Mail, Shield, UserRound } from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <AppShell eyebrow="Account" title="My profile">
      <section className="panel mx-auto max-w-2xl">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">{user.name}</h2>
            <p className="mt-1 capitalize text-slate-500">{user.role} account</p>
          </div>
        </div>
        <dl className="mt-6 space-y-4">
          <ProfileRow icon={UserRound} label="Full name" value={user.name} />
          <ProfileRow icon={Mail} label="Email address" value={user.email} />
          <ProfileRow icon={Shield} label="Access role" value={user.role} />
          <ProfileRow
            icon={BadgeCheck}
            label="Account status"
            value={user.isActive ? 'Active' : 'Inactive'}
          />
        </dl>
        <p className="mt-8 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Contact an administrator if your name, email, or password needs to be changed.
        </p>
      </section>
    </AppShell>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
      <Icon size={19} className="text-indigo-500" />
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm font-semibold capitalize text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
