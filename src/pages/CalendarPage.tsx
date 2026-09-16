import { CalendarDays, Cloud, Clock3, MapPin, Plus, RefreshCw, Trash2, TriangleAlert, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/PriorityBadge';
import { StatCard } from '../components/StatCard';
import { useMeetings } from '../hooks/useMeetings';
import { useTasks } from '../hooks/useTasks';
import type { DaySchedule, Meeting } from '../types';
import { formatLongDate, formatShortDate } from '../utils/date';
import { getLiveTasks } from '../utils/projects';

type MeetingDraft = Omit<Meeting, 'id'>;

const schedules: DaySchedule[] = ['Morning', 'Afternoon', 'Evening'];

const emptyDraft: MeetingDraft = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  time: '09:00',
  attendees: [],
  location: '',
};

export function CalendarPage() {
  const { tasks } = useTasks();
  const { meetings, createMeeting, deleteMeeting, syncError, syncing, syncFromCloud } = useMeetings();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState<MeetingDraft>(emptyDraft);
  const [attendeesInput, setAttendeesInput] = useState('');

  const liveTasks = useMemo(() => getLiveTasks(tasks), [tasks]);
  const selectedTasks = useMemo(
    () => liveTasks.filter((task) => task.dueDate === selectedDate && task.status !== 'Cancelled'),
    [liveTasks, selectedDate],
  );
  const selectedMeetings = useMemo(
    () => meetings
      .filter((meeting) => meeting.date === selectedDate)
      .sort((first, second) => first.time.localeCompare(second.time)),
    [meetings, selectedDate],
  );

  const completedTasks = selectedTasks.filter((task) => task.status === 'Completed').length;

  function handleCreateMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      return;
    }

    createMeeting({
      ...draft,
      title: draft.title.trim(),
      location: draft.location.trim() || 'TBD',
      attendees: attendeesInput
        .split(',')
        .map((attendee) => attendee.trim())
        .filter(Boolean),
    });

    setDraft({ ...emptyDraft, date: selectedDate });
    setAttendeesInput('');
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Calendar</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Daily calendar</h1>
          <p className="mt-2 text-gray-500">{formatLongDate(new Date(`${selectedDate}T00:00:00`))}</p>
        </div>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">View date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setDraft((current) => ({ ...current, date: event.target.value }));
            }}
            className="min-h-11 rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tasks" value={selectedTasks.length} icon={CalendarDays} caption="Scheduled for this date" />
        <StatCard label="Completed" value={completedTasks} icon={Clock3} caption="Finished work blocks" />
        <StatCard label="Meetings" value={selectedMeetings.length} icon={Users} caption="Live calendar items" />
      </section>

      <section
        className={`flex flex-col justify-between gap-3 rounded-md border p-4 shadow-sm sm:flex-row sm:items-center ${
          syncError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
              syncError ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-brand-orange'
            }`}
          >
            {syncError ? <TriangleAlert size={19} /> : <Cloud size={19} />}
          </div>
          <div>
            <p className="font-bold text-brand-black">{syncError ? 'Calendar sync needs attention' : 'Calendar cloud sync'}</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {syncError || (syncing ? 'Syncing meetings with Supabase...' : 'Signed-in devices can share meetings through Supabase.')}
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
          <form onSubmit={handleCreateMeeting} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-brand-black">Create meeting</h2>
                <p className="mt-1 text-sm text-gray-500">Add meetings or calls that should appear on your daily calendar.</p>
              </div>
              <Plus className="text-brand-orange" size={22} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-gray-700">Meeting title</span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                  placeholder="Meeting title"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Date</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Time</span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => setDraft({ ...draft, time: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Location</span>
                <input
                  value={draft.location}
                  onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                  placeholder="Boardroom, phone, Google Meet"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">Attendees</span>
                <input
                  value={attendeesInput}
                  onChange={(event) => setAttendeesInput(event.target.value)}
                  className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
                  placeholder="John, Finance, Customer"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="submit">
                <Plus size={16} />
                Create meeting
              </Button>
            </div>
          </form>

          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <CalendarDays className="text-brand-orange" size={24} />
            <h2 className="mt-4 text-lg font-black text-brand-black">Scheduled work blocks</h2>
            <div className="mt-5 space-y-3">
              {schedules.map((slot) => {
                const slotTasks = selectedTasks.filter((task) => task.schedule === slot);

                return (
                  <div key={slot} className="rounded-md bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-brand-black">{slot}</p>
                      <span className="text-sm font-black text-brand-black">{slotTasks.length}</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {slotTasks.length > 0 ? slotTasks.map((task) => (
                        <div key={task.id} className="rounded-md bg-white p-3 ring-1 ring-gray-100">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div>
                              <p className="font-semibold text-brand-black">{task.title}</p>
                              <p className="mt-1 text-xs text-gray-500">Owner: {task.assignee}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge label={task.priority} type="priority" />
                              <Badge label={task.status} type="status" />
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">No tasks scheduled in this block.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-brand-black">Meetings</h2>
          <p className="mt-1 text-sm text-gray-500">Live meetings for {formatShortDate(selectedDate)}.</p>
          <div className="mt-5 space-y-3">
            {selectedMeetings.length > 0 ? selectedMeetings.map((meeting) => (
              <article key={meeting.id} className="rounded-md border border-gray-200 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-black text-brand-black">{meeting.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={16} />
                        {meeting.time}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={16} />
                        {meeting.location}
                      </span>
                    </div>
                    {meeting.attendees.length > 0 ? (
                      <p className="mt-3 text-sm text-gray-500">Attendees: {meeting.attendees.join(', ')}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    className="h-9 w-9 px-0"
                    onClick={() => deleteMeeting(meeting.id)}
                    aria-label={`Delete ${meeting.title}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </article>
            )) : (
              <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                No live meetings scheduled for this date.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
