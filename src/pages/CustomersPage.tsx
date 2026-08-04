import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Badge } from '../components/PriorityBadge';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';
import { mockCustomers, mockFollowUps } from '../data/mockData';
import { loadCloudFollowUps, saveCloudFollowUp } from '../services/syncService';
import { useAuth } from '../hooks/useAuth';
import { usePersistentState } from '../hooks/usePersistentState';
import type { CustomerStatus, FollowUp, Priority } from '../types';
import { formatShortDate, isPastDue, isToday } from '../utils/date';

type CustomerStatusFilter = CustomerStatus | 'All';
type FollowUpStatusFilter = FollowUp['status'] | 'All';
type FollowUpDraft = Omit<FollowUp, 'id' | 'customer'>;

const emptyDraft: FollowUpDraft = {
  customerId: mockCustomers[0]?.id ?? '',
  note: '',
  dueDate: new Date().toISOString().slice(0, 10),
  priority: 'Medium',
  status: 'Open',
  owner: 'John',
  channel: 'Email',
  nextStep: '',
};

const customerStatusStyles: Record<CustomerStatus, string> = {
  Lead: 'bg-gray-100 text-gray-700',
  Prospect: 'bg-blue-100 text-blue-800',
  Active: 'bg-emerald-100 text-emerald-800',
  'At Risk': 'bg-orange-100 text-orange-800',
  Dormant: 'bg-red-100 text-red-800',
};

const healthStyles = {
  Healthy: 'bg-emerald-100 text-emerald-800',
  Watch: 'bg-orange-100 text-orange-800',
  Risk: 'bg-red-100 text-red-800',
};

export function CustomersPage() {
  const { cloudReady, user } = useAuth();
  const [followUps, setFollowUps] = usePersistentState<FollowUp[]>('ens.followUps.v1', mockFollowUps);
  const [query, setQuery] = useState('');
  const [customerStatus, setCustomerStatus] = useState<CustomerStatusFilter>('All');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatusFilter>('All');
  const [draft, setDraft] = useState<FollowUpDraft>(emptyDraft);
  const loadedCloudUser = useRef<string | null>(null);

  useEffect(() => {
    if (!cloudReady || !user || loadedCloudUser.current === user.id) {
      return;
    }

    loadedCloudUser.current = user.id;

    loadCloudFollowUps()
      .then((cloudFollowUps) => {
        if (cloudFollowUps.length > 0) {
          setFollowUps(cloudFollowUps);
          return;
        }

        void Promise.all(followUps.map((followUp) => saveCloudFollowUp(followUp).catch(() => undefined)));
      })
      .catch(() => {
        loadedCloudUser.current = null;
      });
  }, [cloudReady, followUps, setFollowUps, user]);

  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      const matchesQuery = `${customer.name} ${customer.company} ${customer.owner} ${customer.notes}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = customerStatus === 'All' || customer.status === customerStatus;

      return matchesQuery && matchesStatus;
    });
  }, [query, customerStatus]);

  const filteredFollowUps = useMemo(() => {
    return followUps.filter((followUp) => {
      const customer = mockCustomers.find((item) => item.id === followUp.customerId);
      const matchesQuery = `${followUp.customer} ${followUp.note} ${followUp.owner} ${followUp.nextStep}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = followUpStatus === 'All' || followUp.status === followUpStatus;
      const matchesVisibleCustomer = customer ? filteredCustomers.some((item) => item.id === customer.id) : true;

      return matchesQuery && matchesStatus && matchesVisibleCustomer;
    });
  }, [followUps, followUpStatus, query, filteredCustomers]);

  const summary = useMemo(() => {
    return {
      customers: mockCustomers.length,
      dueToday: followUps.filter((followUp) => isToday(followUp.dueDate) && followUp.status !== 'Completed').length,
      overdue: followUps.filter((followUp) => isPastDue(followUp.dueDate) && followUp.status !== 'Completed').length,
      atRisk: mockCustomers.filter((customer) => customer.status === 'At Risk' || customer.health === 'Risk').length,
    };
  }, [followUps]);

  function handleCreateFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const customer = mockCustomers.find((item) => item.id === draft.customerId);

    if (!customer || !draft.note.trim() || !draft.nextStep.trim()) {
      return;
    }

    const followUp: FollowUp = {
      ...draft,
      id: crypto.randomUUID(),
      customer: customer.company,
      note: draft.note.trim(),
      nextStep: draft.nextStep.trim(),
      owner: draft.owner.trim() || 'John',
    };

    setFollowUps((current) => [followUp, ...current]);
    if (cloudReady && user) {
      void saveCloudFollowUp(followUp).catch(() => undefined);
    }
    setDraft({ ...emptyDraft, customerId: mockCustomers[0]?.id ?? '' });
  }

  function completeFollowUp(followUpId: string) {
    const nextFollowUp = followUps.find((followUp) => followUp.id === followUpId);
    setFollowUps((current) =>
      current.map((followUp) =>
        followUp.id === followUpId ? { ...followUp, status: 'Completed' } : followUp,
      ),
    );

    if (nextFollowUp && cloudReady && user) {
      void saveCloudFollowUp({ ...nextFollowUp, status: 'Completed' }).catch(() => undefined);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Customers</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">CRM follow-up control</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Track customer relationships, account health, owners, next actions, and executive follow-ups.
          </p>
        </div>
        <div className="rounded-md bg-brand-black px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Pipeline value</p>
          <p className="mt-1 text-2xl font-black">
            ${mockCustomers.reduce((sum, customer) => sum + customer.value, 0).toLocaleString()}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={summary.customers} icon={Users} caption="Accounts in CRM" />
        <StatCard label="Due today" value={summary.dueToday} icon={Clock3} caption="Follow-ups to complete" />
        <StatCard label="Overdue" value={summary.overdue} icon={TriangleAlert} caption="Needs escalation" />
        <StatCard label="At risk" value={summary.atRisk} icon={CheckCircle2} caption="Accounts to protect" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleCreateFollowUp} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-brand-black">New follow-up</h2>
              <p className="mt-1 text-sm text-gray-500">Create the next customer action and assign an owner.</p>
            </div>
            <Plus className="text-brand-orange" size={22} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Customer</span>
              <select
                value={draft.customerId}
                onChange={(event) => setDraft({ ...draft, customerId: event.target.value })}
                className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
              >
                {mockCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company} - {customer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Follow-up note</span>
              <textarea
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-brand-orange"
                placeholder="What needs to happen?"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Due date</span>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
                className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Owner</span>
              <input
                value={draft.owner}
                onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
                className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Priority</span>
              <select
                value={draft.priority}
                onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}
                className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Channel</span>
              <select
                value={draft.channel}
                onChange={(event) => setDraft({ ...draft, channel: event.target.value as FollowUp['channel'] })}
                className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
              >
                <option>Email</option>
                <option>Call</option>
                <option>Meeting</option>
                <option>WhatsApp</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-gray-700">Next step</span>
              <input
                value={draft.nextStep}
                onChange={(event) => setDraft({ ...draft, nextStep: event.target.value })}
                className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                placeholder="Specific next action"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit">Create follow-up</Button>
          </div>
        </form>

        <section className="space-y-4">
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3">
                <Search size={18} className="text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                  placeholder="Search customers or follow-ups"
                />
              </label>

              <label className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3">
                <Filter size={17} className="text-gray-400" />
                <select
                  value={customerStatus}
                  onChange={(event) => setCustomerStatus(event.target.value as CustomerStatusFilter)}
                  className="w-full border-0 bg-transparent text-sm outline-none"
                  aria-label="Filter customers by status"
                >
                  <option>All</option>
                  <option>Lead</option>
                  <option>Prospect</option>
                  <option>Active</option>
                  <option>At Risk</option>
                  <option>Dormant</option>
                </select>
              </label>

              <select
                value={followUpStatus}
                onChange={(event) => setFollowUpStatus(event.target.value as FollowUpStatusFilter)}
                className="min-h-11 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none"
                aria-label="Filter follow-ups by status"
              >
                <option>All</option>
                <option>Open</option>
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Waiting</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-brand-black">Follow-up queue</h2>
            <div className="mt-5 space-y-3">
              {filteredFollowUps.map((followUp) => (
                <article key={followUp.id} className="rounded-md border border-gray-200 p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="font-black text-brand-black">{followUp.customer}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-500">{followUp.note}</p>
                      <p className="mt-2 text-sm font-medium text-gray-600">{followUp.nextStep}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge label={followUp.priority} type="priority" />
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                        {followUp.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col justify-between gap-3 text-sm text-gray-500 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap gap-4">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={16} />
                        {formatShortDate(followUp.dueDate)}
                      </span>
                      <span>{followUp.channel}</span>
                      <span>Owner: {followUp.owner}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => completeFollowUp(followUp.id)}
                      disabled={followUp.status === 'Completed'}
                    >
                      <Check size={16} />
                      Complete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {filteredCustomers.map((customer) => (
          <article key={customer.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${customerStatusStyles[customer.status]}`}>
                    {customer.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${healthStyles[customer.health]}`}>
                    {customer.health}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-black text-brand-black">{customer.company}</h2>
                <p className="mt-1 text-sm font-semibold text-gray-600">{customer.name}</p>
              </div>
              <p className="text-2xl font-black text-brand-black">${customer.value.toLocaleString()}</p>
            </div>

            <p className="mt-4 leading-7 text-gray-500">{customer.notes}</p>

            <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <Mail size={16} />
                {customer.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone size={16} />
                {customer.phone}
              </span>
              <span>Owner: {customer.owner}</span>
              <span>Last contact: {formatShortDate(customer.lastContact)}</span>
              <span className="md:col-span-2">Next follow-up: {formatShortDate(customer.nextFollowUp)}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
