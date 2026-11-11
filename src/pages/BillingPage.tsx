import { Check, Clock3, CreditCard, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { planCatalog, getPlan } from '../data/planCatalog';
import { useSubscription } from '../hooks/useSubscription';
import { useWorkspace } from '../hooks/useWorkspace';
import { requestPlanChange } from '../services/subscriptionService';
import type { PlanCode } from '../types';

function formatStorage(megabytes: number) {
  return megabytes >= 1024 ? `${Math.round(megabytes / 1024)} GB` : `${megabytes} MB`;
}

function UsageMeter({ label, value, limit }: { label: string; value: number; limit: number }) {
  const percentage = Math.min(100, Math.round((value / Math.max(limit, 1)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="text-gray-500">{value.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${percentage >= 90 ? 'bg-red-500' : 'bg-brand-orange'}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function BillingPage() {
  const { activeWorkspace } = useWorkspace();
  const { subscription, usage, loading, error, refresh } = useSubscription();
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState<PlanCode | null>(null);
  const currentPlan = getPlan(subscription?.planCode ?? activeWorkspace?.plan);
  const trialDays = useMemo(() => {
    if (!subscription?.trialEndsAt) return 0;
    return Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86_400_000));
  }, [subscription?.trialEndsAt]);

  async function requestChange(planCode: PlanCode) {
    if (!activeWorkspace || planCode === currentPlan.code) return;
    setRequesting(planCode);
    setMessage('');
    try {
      await requestPlanChange(activeWorkspace.id, planCode);
      setMessage(`Your ${planCode} plan request was received. No charge has been made.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'The plan request could not be sent.');
    } finally {
      setRequesting(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Billing & plans</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Subscription control</h1>
          <p className="mt-2 max-w-2xl text-gray-500">Review workspace capacity, plan access, and subscription status from one place.</p>
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Refresh</Button>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">{message}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-md border border-gray-200 bg-brand-black p-6 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-md bg-brand-orange text-white"><CreditCard size={22} /></div><span className="rounded-md bg-white/10 px-3 py-2 text-xs font-bold">{subscription?.status ?? 'Active'}</span></div>
          <p className="mt-7 text-sm font-semibold text-gray-400">Current plan</p>
          <h2 className="mt-1 text-3xl font-black">{currentPlan.name}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-300">{currentPlan.description}</p>
          {subscription?.status === 'Trialing' ? <p className="mt-5 flex items-center gap-2 text-sm font-bold text-orange-300"><Clock3 size={16} />{trialDays} trial day{trialDays === 1 ? '' : 's'} remaining</p> : null}
          <p className="mt-5 flex items-center gap-2 text-sm text-gray-300"><ShieldCheck size={16} className="text-brand-orange" />Workspace data remains isolated and protected.</p>
        </article>

        <article className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><Users size={21} className="text-brand-orange" /><div><h2 className="text-lg font-black">Workspace usage</h2><p className="text-sm text-gray-500">Capacity currently used by {activeWorkspace?.name ?? 'this workspace'}.</p></div></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <UsageMeter label="Team members" value={usage.members} limit={currentPlan.maxMembers} />
            <UsageMeter label="Customers" value={usage.customers} limit={currentPlan.maxCustomers} />
            <UsageMeter label="Projects" value={usage.projects} limit={currentPlan.maxProjects} />
            <UsageMeter label="Storage (MB)" value={usage.storageMb} limit={currentPlan.storageMb} />
          </div>
        </article>
      </section>

      <section>
        <div><h2 className="text-xl font-black">Available plans</h2><p className="mt-1 text-sm text-gray-500">Plan changes are reviewed until online payment is connected.</p></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {planCatalog.map((plan) => {
            const selected = plan.code === currentPlan.code;
            return <article key={plan.code} className={`flex flex-col rounded-md border bg-white p-5 shadow-sm ${selected ? 'border-brand-orange ring-1 ring-brand-orange' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">{plan.name}</h3>{selected ? <span className="rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-700">Current</span> : null}</div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-gray-500">{plan.description}</p>
              <div className="mt-5 space-y-3 text-sm text-gray-700">
                <p className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-orange" />Up to {plan.maxMembers} member{plan.maxMembers === 1 ? '' : 's'}</p>
                <p className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-orange" />{plan.maxCustomers.toLocaleString()} customers</p>
                <p className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-orange" />{plan.maxProjects.toLocaleString()} projects</p>
                <p className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-orange" />{formatStorage(plan.storageMb)} storage</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">{plan.modules.map((module) => <span key={module} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{module}</span>)}</div>
              <Button className="mt-6 w-full" variant={selected ? 'secondary' : 'primary'} disabled={selected || requesting !== null} onClick={() => void requestChange(plan.code)}>{selected ? 'Current plan' : requesting === plan.code ? 'Sending request...' : 'Request plan change'}</Button>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
