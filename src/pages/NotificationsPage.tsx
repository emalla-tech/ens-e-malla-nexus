import { Bell, CalendarClock, CheckCheck, CheckCircle2, ClipboardCheck, Flag, RefreshCw, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFollowUps } from '../hooks/useFollowUps';
import { useGoals } from '../hooks/useGoals';
import { useMeetings } from '../hooks/useMeetings';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTasks } from '../hooks/useTasks';
import { formatShortDate } from '../utils/date';
import { getLiveTasks } from '../utils/projects';

type AlertKind = 'Task' | 'Meeting' | 'Follow-up' | 'Goal';
type AlertUrgency = 'urgent' | 'upcoming' | 'progress';
type Filter = 'All' | 'Unread' | 'Urgent';

interface ExecutiveAlert {
  id: string;
  kind: AlertKind;
  urgency: AlertUrgency;
  title: string;
  description: string;
  dateLabel: string;
  href: string;
  sortDate: string;
}

const iconByKind = { Task: ClipboardCheck, Meeting: CalendarClock, 'Follow-up': Users, Goal: Flag };

function daysFromToday(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

export function NotificationsPage() {
  const { tasks, syncing: tasksSyncing, syncFromCloud: syncTasks } = useTasks();
  const { meetings, syncing: meetingsSyncing, syncFromCloud: syncMeetings } = useMeetings();
  const { followUps, syncing: followUpsSyncing, syncFromCloud: syncFollowUps } = useFollowUps();
  const { goals, syncing: goalsSyncing, syncFromCloud: syncGoals } = useGoals();
  const [readIds, setReadIds] = usePersistentState<string[]>('ens.notifications.read.v1', []);
  const [filter, setFilter] = useState<Filter>('All');

  const alerts = useMemo(() => {
    const items: ExecutiveAlert[] = [];

    getLiveTasks(tasks).forEach((task) => {
      if (task.status === 'Completed' || task.status === 'Cancelled') return;
      const days = daysFromToday(task.dueDate);
      if (days > 1) return;
      items.push({ id: `task-${task.id}-${task.dueDate}`, kind: 'Task', urgency: days < 0 ? 'urgent' : 'upcoming', title: days < 0 ? `Overdue: ${task.title}` : `${days === 0 ? 'Due today' : 'Due tomorrow'}: ${task.title}`, description: `${task.priority} priority, assigned to ${task.assignee}.`, dateLabel: formatShortDate(task.dueDate), href: '/tasks', sortDate: task.dueDate });
    });

    followUps.forEach((followUp) => {
      if (followUp.status === 'Completed') return;
      const days = daysFromToday(followUp.dueDate);
      if (days > 1) return;
      items.push({ id: `follow-up-${followUp.id}-${followUp.dueDate}`, kind: 'Follow-up', urgency: days < 0 ? 'urgent' : 'upcoming', title: days < 0 ? `Follow-up overdue: ${followUp.customer}` : `Follow up with ${followUp.customer}`, description: followUp.nextStep || followUp.note, dateLabel: formatShortDate(followUp.dueDate), href: '/customers', sortDate: followUp.dueDate });
    });

    meetings.forEach((meeting) => {
      const days = daysFromToday(meeting.date);
      if (days < 0 || days > 1) return;
      items.push({ id: `meeting-${meeting.id}-${meeting.date}`, kind: 'Meeting', urgency: 'upcoming', title: `${days === 0 ? 'Today' : 'Tomorrow'} at ${meeting.time}: ${meeting.title}`, description: `${meeting.location}${meeting.attendees.length ? ` · ${meeting.attendees.length} attendee${meeting.attendees.length === 1 ? '' : 's'}` : ''}`, dateLabel: formatShortDate(meeting.date), href: '/calendar', sortDate: meeting.date });
    });

    goals.forEach((goal) => {
      if (goal.progress >= 50) return;
      items.push({ id: `goal-${goal.id}-${goal.progress}`, kind: 'Goal', urgency: 'progress', title: `Goal needs momentum: ${goal.title}`, description: `${goal.horizon} goal is currently ${goal.progress}% complete.`, dateLabel: `${goal.progress}% complete`, href: '/goals', sortDate: '9999-12-31' });
    });

    return items.sort((first, second) => {
      if (first.urgency === 'urgent' && second.urgency !== 'urgent') return -1;
      if (first.urgency !== 'urgent' && second.urgency === 'urgent') return 1;
      return first.sortDate.localeCompare(second.sortDate);
    });
  }, [followUps, goals, meetings, tasks]);

  const unreadCount = alerts.filter((alert) => !readIds.includes(alert.id)).length;
  const visibleAlerts = alerts.filter((alert) => filter === 'Unread' ? !readIds.includes(alert.id) : filter === 'Urgent' ? alert.urgency === 'urgent' : true);
  const syncing = tasksSyncing || meetingsSyncing || followUpsSyncing || goalsSyncing;

  function markRead(alertId: string) {
    setReadIds((current) => current.includes(alertId) ? current : [...current, alertId]);
  }

  function refreshAll() {
    syncTasks();
    syncMeetings();
    syncFollowUps();
    syncGoals();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Notifications</p><h1 className="mt-2 text-3xl font-black text-brand-black">Executive alerts</h1><p className="mt-2 max-w-2xl text-gray-500">Live priorities from your tasks, meetings, customer follow-ups, and goals.</p></div>
        <button type="button" onClick={refreshAll} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-bold text-brand-black shadow-sm hover:bg-gray-50"><RefreshCw size={17} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Syncing' : 'Refresh'}</button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-gray-500">Active alerts</p><p className="mt-2 text-3xl font-black">{alerts.length}</p></div>
        <div className="rounded-md border border-orange-200 bg-orange-50 p-5 shadow-sm"><p className="text-sm font-semibold text-orange-800">Unread</p><p className="mt-2 text-3xl font-black text-brand-black">{unreadCount}</p></div>
        <div className="rounded-md border border-red-200 bg-red-50 p-5 shadow-sm"><p className="text-sm font-semibold text-red-700">Urgent</p><p className="mt-2 text-3xl font-black text-brand-black">{alerts.filter((alert) => alert.urgency === 'urgent').length}</p></div>
      </section>

      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-md bg-gray-100 p-1">{(['All', 'Unread', 'Urgent'] as Filter[]).map((option) => <button key={option} type="button" onClick={() => setFilter(option)} className={`min-h-9 rounded-md px-4 text-sm font-semibold ${filter === option ? 'bg-white text-brand-black shadow-sm' : 'text-gray-500'}`}>{option}</button>)}</div>
        {unreadCount > 0 ? <button type="button" onClick={() => setReadIds(alerts.map((alert) => alert.id))} className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-bold text-brand-black"><CheckCheck size={17} />Mark all as read</button> : null}
      </section>

      <section className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        {visibleAlerts.length > 0 ? visibleAlerts.map((alert) => {
          const Icon = iconByKind[alert.kind];
          const unread = !readIds.includes(alert.id);
          return <Link key={alert.id} to={alert.href} onClick={() => markRead(alert.id)} className={`flex gap-4 border-b border-gray-100 p-5 transition last:border-b-0 hover:bg-gray-50 ${unread ? 'bg-orange-50/40' : ''}`}><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${alert.urgency === 'urgent' ? 'bg-red-100 text-red-700' : unread ? 'bg-orange-100 text-brand-orange' : 'bg-gray-100 text-gray-500'}`}><Icon size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase text-gray-400">{alert.kind}</span>{unread ? <span className="h-2 w-2 rounded-full bg-brand-orange" /> : <CheckCircle2 size={15} className="text-emerald-600" />}</div><h2 className="mt-1 font-black text-brand-black">{alert.title}</h2><p className="mt-1 text-sm leading-6 text-gray-500">{alert.description}</p><p className="mt-2 text-xs font-semibold text-gray-400">{alert.dateLabel}</p></div></Link>;
        }) : <div className="px-6 py-14 text-center"><Bell className="mx-auto text-gray-300" size={32} /><h2 className="mt-4 font-black text-brand-black">You are all caught up</h2><p className="mt-2 text-sm text-gray-500">No alerts match this view.</p></div>}
      </section>
    </div>
  );
}
