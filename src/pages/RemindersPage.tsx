import { AlarmClock, Check, ChevronDown, Cloud, Plus, RefreshCw, Search, TimerReset, Trash2, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { useReminders } from '../hooks/useReminders';
import type { Priority, Reminder, ReminderCategory, ReminderRepeat } from '../types';
import { formatShortDate, getLocalDateKey } from '../utils/date';

type Filter = 'Today' | 'Upcoming' | 'Completed' | 'All';
type Draft = Omit<Reminder, 'id' | 'createdAt'>;
const categories: ReminderCategory[] = ['Personal', 'Business', 'Customer', 'Payment', 'Call'];
const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const repeats: ReminderRepeat[] = ['Once', 'Daily', 'Weekly', 'Monthly'];

function initialDraft(): Draft {
  return { title: '', notes: '', category: 'Business', priority: 'Medium', date: getLocalDateKey(), time: '09:00', repeat: 'Once', status: 'Active' };
}

function shiftDate(value: string, repeat: ReminderRepeat) {
  const date = new Date(`${value}T12:00:00`);
  if (repeat === 'Daily') date.setDate(date.getDate() + 1);
  if (repeat === 'Weekly') date.setDate(date.getDate() + 7);
  if (repeat === 'Monthly') date.setMonth(date.getMonth() + 1);
  return getLocalDateKey(date);
}

function snoozeTarget(minutes: number) {
  const date = new Date(Date.now() + minutes * 60_000);
  return { date: getLocalDateKey(date), time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` };
}

const priorityStyle: Record<Priority, string> = {
  Critical: 'bg-red-50 text-red-700', High: 'bg-orange-50 text-orange-700', Medium: 'bg-amber-50 text-amber-700', Low: 'bg-gray-100 text-gray-600',
};

export function RemindersPage() {
  const { reminders, createReminder, updateReminder, deleteReminder, syncError, syncing, syncFromCloud } = useReminders();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [filter, setFilter] = useState<Filter>('Today');
  const [search, setSearch] = useState('');
  const today = getLocalDateKey();

  const counts = useMemo(() => ({
    today: reminders.filter((item) => item.status === 'Active' && item.date <= today).length,
    upcoming: reminders.filter((item) => item.status === 'Active' && item.date > today).length,
    completed: reminders.filter((item) => item.status === 'Completed').length,
  }), [reminders, today]);

  const visible = reminders.filter((item) => {
    const matchesSearch = `${item.title} ${item.notes} ${item.category}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'Today') return item.status === 'Active' && item.date <= today;
    if (filter === 'Upcoming') return item.status === 'Active' && item.date > today;
    if (filter === 'Completed') return item.status === 'Completed';
    return true;
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    createReminder({ ...draft, title: draft.title.trim(), notes: draft.notes.trim() });
    setDraft(initialDraft());
  }

  function complete(item: Reminder) {
    if (item.repeat === 'Once') updateReminder(item.id, { status: 'Completed' });
    else updateReminder(item.id, { date: shiftDate(item.date < today ? today : item.date, item.repeat), status: 'Active' });
  }

  function snooze(item: Reminder, minutes: number) {
    updateReminder(item.id, { ...snoozeTarget(minutes), status: 'Active' });
  }

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Reminders</p><h1 className="mt-2 text-3xl font-black text-brand-black">Never miss the next move</h1><p className="mt-2 max-w-2xl text-gray-500">Schedule personal and business reminders that stay synchronized across your devices.</p></div>
      <Button type="button" onClick={() => document.getElementById('reminder-title')?.focus()}><Plus size={17} />New reminder</Button>
    </section>

    <section className="grid gap-4 sm:grid-cols-3">
      {[[counts.today, 'Due now', 'Today and overdue'], [counts.upcoming, 'Upcoming', 'Scheduled ahead'], [counts.completed, 'Completed', 'Finished reminders']].map(([value, label, caption]) => <div key={String(label)} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-2 text-3xl font-black text-brand-black">{value}</p><p className="mt-1 text-xs text-gray-400">{caption}</p></div>)}
    </section>

    <section className={`flex flex-col justify-between gap-3 rounded-md border p-4 shadow-sm sm:flex-row sm:items-center ${syncError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${syncError ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-brand-orange'}`}>{syncError ? <TriangleAlert size={19} /> : <Cloud size={19} />}</div><div><p className="font-bold text-brand-black">{syncError ? 'Reminder sync needs attention' : 'Reminders cloud sync'}</p><p className="mt-1 text-sm text-gray-500">{syncError || (syncing ? 'Syncing reminders...' : 'Your phone and computer share the same reminders.')}</p></div></div>
      <button type="button" onClick={() => syncFromCloud()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold ring-1 ring-gray-200"><RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />Sync now</button>
    </section>

    <form onSubmit={submit} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-brand-black">Create reminder</h2><p className="mt-1 text-sm text-gray-500">Choose exactly when and how often ENs should remind you.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-gray-700">Title</span><input id="reminder-title" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Call supplier about delivery" className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /></label>
        <label className="space-y-2 md:col-span-2"><span className="text-sm font-semibold text-gray-700">Notes</span><input value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Optional details" className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Date</span><input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Time</span><input required type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Category</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ReminderCategory })} className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3">{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Priority</span><select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })} className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3">{priorities.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Repeat</span><select value={draft.repeat} onChange={(event) => setDraft({ ...draft, repeat: event.target.value as ReminderRepeat })} className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3">{repeats.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div><div className="mt-5 flex justify-end"><Button type="submit"><Plus size={16} />Create reminder</Button></div>
    </form>

    <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex overflow-x-auto rounded-md bg-gray-100 p-1">{(['Today', 'Upcoming', 'Completed', 'All'] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-9 shrink-0 rounded-md px-4 text-sm font-semibold ${filter === value ? 'bg-white text-brand-black shadow-sm' : 'text-gray-500'}`}>{value}</button>)}</div>
      <label className="relative block lg:w-80"><Search size={17} className="absolute left-3 top-3 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reminders" className="min-h-11 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 outline-none focus:border-brand-orange" /></label>
    </section>

    <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      {visible.length ? visible.map((item) => <article key={item.id} className="border-b border-gray-100 p-5 last:border-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-orange-50 text-brand-orange"><AlarmClock size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className={`font-black text-brand-black ${item.status === 'Completed' ? 'line-through opacity-60' : ''}`}>{item.title}</h2><span className={`rounded-md px-2 py-1 text-xs font-bold ${priorityStyle[item.priority]}`}>{item.priority}</span><span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{item.category}</span>{item.repeat !== 'Once' ? <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{item.repeat}</span> : null}</div><p className="mt-1 text-sm text-gray-500">{formatShortDate(item.date)} at {item.time}{item.date < today && item.status === 'Active' ? <span className="ml-2 font-bold text-red-600">Overdue</span> : null}</p>{item.notes ? <p className="mt-2 text-sm text-gray-600">{item.notes}</p> : null}</div></div>
          <div className="flex flex-wrap gap-2 lg:justify-end">{item.status === 'Active' ? <><Button type="button" variant="secondary" onClick={() => complete(item)}><Check size={16} />Complete</Button><details className="relative"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-bold"><TimerReset size={16} />Snooze<ChevronDown size={14} /></summary><div className="absolute right-0 z-10 mt-2 grid w-36 rounded-md border border-gray-200 bg-white p-1 shadow-lg"><button className="rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => snooze(item, 10)}>10 minutes</button><button className="rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => snooze(item, 60)}>1 hour</button><button className="rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => snooze(item, 1440)}>Tomorrow</button></div></details></> : null}<Button type="button" variant="danger" onClick={() => deleteReminder(item.id)} aria-label={`Delete ${item.title}`}><Trash2 size={16} /><span className="hidden sm:inline">Delete</span></Button></div>
        </div>
      </article>) : <div className="p-10 text-center"><AlarmClock className="mx-auto text-gray-300" size={34} /><p className="mt-3 font-black text-brand-black">No reminders in this view</p><p className="mt-1 text-sm text-gray-500">Create one above or select another filter.</p></div>}
    </section>
  </div>;
}
