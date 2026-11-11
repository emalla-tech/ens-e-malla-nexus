import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthPanel } from '../components/AuthPanel';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { updatePassword } from '../services/authService';

export function AuthPage() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const resetMode = params.get('reset') === '1';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function savePassword(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await updatePassword(password);
      setMessage(response.error ? response.error.message : 'Password updated. You can continue to ENs.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Password update failed.'); }
    finally { setBusy(false); }
  }

  if (!loading && user && !resetMode) return <Navigate to="/" replace />;
  return <main className="min-h-screen bg-brand-gray px-4 py-8 md:py-14">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-md border border-gray-200 bg-white shadow-premium lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between bg-brand-black p-7 text-white md:p-10">
        <Logo />
        <div className="my-12"><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Executive operating system</p><h1 className="mt-3 text-4xl font-black leading-tight">Your company. Your team. Your private workspace.</h1><p className="mt-4 max-w-md leading-7 text-gray-300">Run tasks, customers, projects, finance, and follow-ups without mixing your data with another organization.</p></div>
        <div className="space-y-3 text-sm text-gray-300"><p className="flex gap-2"><ShieldCheck size={18} className="text-brand-orange" />Workspace-isolated business data</p><p className="flex gap-2"><CheckCircle2 size={18} className="text-brand-orange" />14-day plan trial for new workspaces</p></div>
      </section>
      <section className="p-5 md:p-8">
        {resetMode && user ? <form onSubmit={savePassword} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><KeyRound size={24} className="text-brand-orange" /><h2 className="mt-4 text-xl font-black">Create a new password</h2><p className="mt-2 text-sm text-gray-500">Use at least eight characters for your new account password.</p><label className="mt-5 block space-y-2"><span className="text-sm font-semibold">New password</span><input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="control" /></label>{message ? <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-600">{message}</p> : null}<Button className="mt-5 w-full" type="submit" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</Button></form> : <AuthPanel />}
      </section>
    </div>
  </main>;
}
