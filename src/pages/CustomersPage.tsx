import {
  CalendarDays,
  Check,
  CheckCircle2,
  Cloud,
  Clock3,
  Filter,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/PriorityBadge';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useCustomers } from '../hooks/useCustomers';
import { usePersistentState } from '../hooks/usePersistentState';
import { loadCloudFollowUps, saveCloudFollowUp } from '../services/syncService';
import type { Customer, CustomerHealth, CustomerStatus, FollowUp, Priority } from '../types';
import { getLiveFollowUps } from '../utils/crm';
import { formatShortDate, isPastDue, isToday } from '../utils/date';

type CustomerStatusFilter = CustomerStatus | 'All';
type FollowUpStatusFilter = FollowUp['status'] | 'All';
type CustomerDraft = Omit<Customer, 'id'>;
type FollowUpDraft = Omit<FollowUp, 'id' | 'customer'>;

const customerStatuses: CustomerStatus[] = ['Lead', 'Prospect', 'Active', 'At Risk', 'Dormant'];
const customerHealthOptions: CustomerHealth[] = ['Healthy', 'Watch', 'Risk'];
const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

const emptyCustomerDraft: CustomerDraft = {
  name: '',
  company: '',
  email: '',
  phone: '',
  status: 'Lead',
  health: 'Healthy',
  owner: 'John',
  value: 0,
  lastContact: new Date().toISOString().slice(0, 10),
  nextFollowUp: new Date().toISOString().slice(0, 10),
  notes: '',
};

const emptyFollowUpDraft: FollowUpDraft = {
  customerId: '',
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

const healthStyles: Record<CustomerHealth, string> = {
  Healthy: 'bg-emerald-100 text-emerald-800',
  Watch: 'bg-orange-100 text-orange-800',
  Risk: 'bg-red-100 text-red-800',
};

export function CustomersPage() {
  const { cloudReady, user } = useAuth();
  const { customers, createCustomer, syncError, syncing, syncFromCloud } = useCustomers();
  const [followUps, setFollowUps] = usePersistentState<FollowUp[]>('ens.followUps.v1', []);
  const [query, setQuery] = useState('');
  const [customerStatus, setCustomerStatus] = useState<CustomerStatusFilter>('All');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatusFilter>('All');
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>(emptyCustomerDraft);
  const [followUpDraft, setFollowUpDraft] = useState<FollowUpDraft>(emptyFollowUpDraft);
  const [followUpSyncError, setFollowUpSyncError] = useState('');
  const loadedFollowUpsUser = useRef<string | null>(null);

  useEffect(() => {
    if (!cloudReady || !user || loadedFollowUpsUser.current === user.id) {
      return;
    }

    loadedFollowUpsUser.current = user.id;

    loadCloudFollowUps()
      .then((cloudFollowUps) => {
        if (cloudFollowUps.length > 0) {
          setFollowUps(cloudFollowUps);
          return;
        }

        void Promise.all(getLiveFollowUps(followUps).map((followUp) => saveCloudFollowUp(followUp).catch(() => undefined)));
      })
      .catch(() => {
        loadedFollowUpsUser.current = null;
      });
  }, [cloudReady, followUps, setFollowUps, user]);

  useEffect(() => {
    if (followUpDraft.customerId || customers.length === 0) {
      return;
    }

    setFollowUpDraft((current) => ({ ...current, customerId: customers[0].id }));
  }, [customers, followUpDraft.customerId]);

  const liveFollowUps = useMemo(() => getLiveFollowUps(followUps), [followUps]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesQuery = `${customer.name} ${customer.company} ${customer.owner} ${customer.notes}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = customerStatus === 'All' || customer.status === customerStatus;

      return matchesQuery && matchesStatus;
    });
  }, [customers, query, customerStatus]);

  const filteredFollowUps = useMemo(() => {
    return liveFollowUps.filter((followUp) => {
      const customer = customers.find((item) => item.id === followUp.customerId);
      const matchesQuery = `${followUp.customer} ${followUp.note} ${followUp.owner} ${followUp.nextStep}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = followUpStatus === 'All' || followUp.status === followUpStatus;
      const matchesVisibleCustomer = customer ? filteredCustomers.some((item) => item.id === customer.id) : true;

      return matchesQuery && matchesStatus && matchesVisibleCustomer;
    });
  }, [customers, filteredCustomers, followUpStatus, liveFollowUps, query]);

  const summary = useMemo(() => {
    return {
      customers: customers.length,
      dueToday: liveFollowUps.filter((followUp) => isToday(followUp.dueDate) && followUp.status !== 'Completed').length,
      overdue: liveFollowUps.filter((followUp) => isPastDue(followUp.dueDate) && followUp.status !== 'Completed').length,
      atRisk: customers.filter((customer) => customer.status === 'At Risk' || customer.health === 'Risk').length,
      pipeline: customers.reduce((sum, customer) => sum + customer.value, 0),
    };
  }, [customers, liveFollowUps]);

  function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customerDraft.company.trim() || !customerDraft.name.trim()) {
      return;
    }

    createCustomer({
      ...customerDraft,
      name: customerDraft.name.trim(),
      company: customerDraft.company.trim(),
      email: customerDraft.email.trim(),
      phone: customerDraft.phone.trim(),
      owner: customerDraft.owner.trim() || 'John',
      value: Number(customerDraft.value) || 0,
      notes: customerDraft.notes.trim(),
    });
    setCustomerDraft(emptyCustomerDraft);
  }

  function handleCreateFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const customer = customers.find((item) => item.id === followUpDraft.customerId);

    if (!customer || !followUpDraft.note.trim() || !followUpDraft.nextStep.trim()) {
      return;
    }

    const followUp: FollowUp = {
      ...followUpDraft,
      id: crypto.randomUUID(),
      customer: customer.company,
      note: followUpDraft.note.trim(),
      nextStep: followUpDraft.nextStep.trim(),
      owner: followUpDraft.owner.trim() || customer.owner || 'John',
    };

    setFollowUps((current) => [followUp, ...getLiveFollowUps(current)]);
    if (cloudReady && user) {
      setFollowUpSyncError('');
      void saveCloudFollowUp(followUp).catch((error) => {
        setFollowUpSyncError(error instanceof Error ? error.message : 'Follow-up was saved locally but cloud sync failed.');
      });
    }
    setFollowUpDraft({ ...emptyFollowUpDraft, customerId: customers[0]?.id ?? '' });
  }

  function completeFollowUp(followUpId: string) {
    const nextFollowUp = liveFollowUps.find((followUp) => followUp.id === followUpId);
    setFollowUps((current) =>
      getLiveFollowUps(current).map((followUp) =>
        followUp.id === followUpId ? { ...followUp, status: 'Completed' } : followUp,
      ),
    );

    if (nextFollowUp && cloudReady && user) {
      setFollowUpSyncError('');
      void saveCloudFollowUp({ ...nextFollowUp, status: 'Completed' }).catch((error) => {
        setFollowUpSyncError(error instanceof Error ? error.message : 'Follow-up was completed locally but cloud sync failed.');
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Customers</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">CRM follow-up control</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Track real customer relationships, account health, owners, next actions, and executive follow-ups.
          </p>
        </div>
        <div className="rounded-md bg-brand-black px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Pipeline value</p>
          <p className="mt-1 text-2xl font-black">${summary.pipeline.toLocaleString()}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={summary.customers} icon={Users} caption="Accounts in CRM" />
        <StatCard label="Due today" value={summary.dueToday} icon={Clock3} caption="Follow-ups to complete" />
        <StatCard label="Overdue" value={summary.overdue} icon={TriangleAlert} caption="Needs escalation" />
        <StatCard label="At risk" value={summary.atRisk} icon={CheckCircle2} caption="Accounts to protect" />
      </section>

      <section
        className={`flex flex-col justify-between gap-3 rounded-md border p-4 shadow-sm sm:flex-row sm:items-center ${
          syncError || followUpSyncError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
              syncError || followUpSyncError ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-brand-orange'
            }`}
          >
            {syncError || followUpSyncError ? <TriangleAlert size={19} /> : <Cloud size={19} />}
          </div>
          <div>
            <p className="font-bold text-brand-black">{syncError || followUpSyncError ? 'CRM sync needs attention' : 'CRM cloud sync'}</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {syncError || followUpSyncError || (syncing ? 'Syncing customers with Supabase...' : 'Signed-in devices can share customers and follow-ups through Supabase.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-brand-black ring-1 ring-gray-200 hover:bg-gray-50"
          onClick={() => syncFromCloud()}
        >
          <RefreshCw size={16} />
          Sync now
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-6">
          <form onSubmit={handleCreateCustomer} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-brand-black">New customer</h2>
                <p className="mt-1 text-sm text-gray-500">Create the account once, then attach follow-ups to it.</p>
              </div>
              <Plus className="text-brand-orange" size={22} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Company</span>
                <input
                  value={customerDraft.company}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, company: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                  placeholder="Company name"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Contact name</span>
                <input
                  value={customerDraft.name}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, name: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                  placeholder="Main contact"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Email</span>
                <input
                  type="email"
                  value={customerDraft.email}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, email: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Phone</span>
                <input
                  value={customerDraft.phone}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, phone: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Status</span>
                <select
                  value={customerDraft.status}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, status: event.target.value as CustomerStatus })}
                  className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
                >
                  {customerStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Health</span>
                <select
                  value={customerDraft.health}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, health: event.target.value as CustomerHealth })}
                  className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
                >
                  {customerHealthOptions.map((health) => (
                    <option key={health}>{health}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Owner</span>
                <input
                  value={customerDraft.owner}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, owner: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Value</span>
                <input
                  type="number"
                  min="0"
                  value={customerDraft.value}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, value: Number(event.target.value) })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Last contact</span>
                <input
                  type="date"
                  value={customerDraft.lastContact}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, lastContact: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Next follow-up</span>
                <input
                  type="date"
                  value={customerDraft.nextFollowUp}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, nextFollowUp: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-gray-700">Notes</span>
                <textarea
                  value={customerDraft.notes}
                  onChange={(event) => setCustomerDraft({ ...customerDraft, notes: event.target.value })}
                  className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-brand-orange"
                  placeholder="Relationship context, risk, or opportunity"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="submit">
                <Plus size={16} />
                Create customer
              </Button>
            </div>
          </form>

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
                  value={followUpDraft.customerId}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, customerId: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
                  disabled={customers.length === 0}
                >
                  {customers.length === 0 ? <option value="">Create a customer first</option> : null}
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company} - {customer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-gray-700">Follow-up note</span>
                <textarea
                  value={followUpDraft.note}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, note: event.target.value })}
                  className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-brand-orange"
                  placeholder="What needs to happen?"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Due date</span>
                <input
                  type="date"
                  value={followUpDraft.dueDate}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, dueDate: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Owner</span>
                <input
                  value={followUpDraft.owner}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, owner: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Priority</span>
                <select
                  value={followUpDraft.priority}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, priority: event.target.value as Priority })}
                  className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Channel</span>
                <select
                  value={followUpDraft.channel}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, channel: event.target.value as FollowUp['channel'] })}
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
                  value={followUpDraft.nextStep}
                  onChange={(event) => setFollowUpDraft({ ...followUpDraft, nextStep: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                  placeholder="Specific next action"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="submit" disabled={customers.length === 0}>
                Create follow-up
              </Button>
            </div>
          </form>
        </div>

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
                  {customerStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
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
              {filteredFollowUps.length > 0 ? filteredFollowUps.map((followUp) => (
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
              )) : (
                <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                  No live follow-ups yet. Create a customer, then add the next action.
                </p>
              )}
            </div>
          </div>
        </section>
      </section>

      {filteredCustomers.length > 0 ? (
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

              <p className="mt-4 leading-7 text-gray-500">{customer.notes || 'No customer notes yet.'}</p>

              <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                <span className="inline-flex items-center gap-2">
                  <Mail size={16} />
                  {customer.email || 'No email'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Phone size={16} />
                  {customer.phone || 'No phone'}
                </span>
                <span>Owner: {customer.owner}</span>
                <span>Last contact: {formatShortDate(customer.lastContact)}</span>
                <span className="md:col-span-2">Next follow-up: {formatShortDate(customer.nextFollowUp)}</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-black text-brand-black">No live customers yet</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Create your first customer to start building the CRM pipeline.
          </p>
        </section>
      )}
    </div>
  );
}
