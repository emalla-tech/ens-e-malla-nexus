import { Cloud, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { signInWithEmail, signOut, signUpWithEmail } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';

export function AuthPanel() {
  const { loading, user } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [fullName, setFullName] = useState('John');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const response =
        mode === 'sign-in'
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password, fullName);

      if (response.error) {
        setMessage(response.error.message);
        return;
      }

      setMessage(mode === 'sign-in' ? 'Signed in. Cloud sync is active.' : 'Account created. Check your email if confirmation is enabled.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <Cloud className="text-brand-orange" size={24} />
        <h2 className="mt-4 text-xl font-black text-brand-black">Cloud sync</h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Supabase keys are not configured yet. ENs is currently saving work on this device.
        </p>
      </article>
    );
  }

  if (loading) {
    return (
      <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <Cloud className="text-brand-orange" size={24} />
        <h2 className="mt-4 text-xl font-black text-brand-black">Cloud sync</h2>
        <p className="mt-3 text-sm text-gray-500">Checking your session...</p>
      </article>
    );
  }

  if (user) {
    return (
      <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <ShieldCheck className="text-brand-orange" size={24} />
        <h2 className="mt-4 text-xl font-black text-brand-black">Cloud sync active</h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Signed in as <span className="font-semibold text-brand-black">{user.email}</span>. Tasks and CRM follow-ups can sync with Supabase.
        </p>
        <div className="mt-5">
          <Button type="button" variant="secondary" onClick={() => void signOut()}>
            <LogOut size={17} />
            Sign out
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <Cloud className="text-brand-orange" size={24} />
      <h2 className="mt-4 text-xl font-black text-brand-black">Cloud sync</h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">
        Sign in to sync tasks and CRM follow-ups between your phone and computer.
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-md bg-gray-100 p-1">
        <button
          className={`min-h-10 rounded-md text-sm font-bold ${mode === 'sign-in' ? 'bg-white text-brand-black shadow-sm' : 'text-gray-500'}`}
          type="button"
          onClick={() => setMode('sign-in')}
        >
          Sign in
        </button>
        <button
          className={`min-h-10 rounded-md text-sm font-bold ${mode === 'sign-up' ? 'bg-white text-brand-black shadow-sm' : 'text-gray-500'}`}
          type="button"
          onClick={() => setMode('sign-up')}
        >
          Sign up
        </button>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        {mode === 'sign-up' ? (
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
            />
          </label>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Email</span>
          <div className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3 focus-within:border-brand-orange">
            <Mail size={17} className="text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border-0 bg-transparent outline-none"
              required
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
            minLength={6}
            required
          />
        </label>

        {message ? <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">{message}</p> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Working...' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </Button>
      </form>
    </article>
  );
}
