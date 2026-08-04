import { Building2, UserRound } from 'lucide-react';
import { AuthPanel } from '../components/AuthPanel';
import { Logo } from '../components/Logo';
import { isSupabaseConfigured } from '../services/supabase';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Settings</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Workspace settings</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Manage account, company profile, product identity, and future integration readiness.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <AuthPanel />

        <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <UserRound className="text-brand-orange" size={24} />
          <h2 className="mt-4 text-xl font-black text-brand-black">Profile</h2>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Name</span>
              <input className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" defaultValue="John" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Role</span>
              <input className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" defaultValue="Founder" />
            </label>
          </div>
        </article>

        <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <Building2 className="text-brand-orange" size={24} />
          <h2 className="mt-4 text-xl font-black text-brand-black">Company</h2>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Product name</span>
              <div className="flex min-h-11 items-center rounded-md border border-gray-200 px-3">
                <Logo dark />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Supabase status</span>
              <input
                className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                value={isSupabaseConfigured() ? 'Configured' : 'Ready for future configuration'}
                readOnly
              />
            </label>
          </div>
        </article>
      </section>
    </div>
  );
}
