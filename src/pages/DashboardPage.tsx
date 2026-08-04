import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Plus,
  Target,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { mockCustomers, mockFollowUps, mockMeetings, mockNotes, mockProjects, mockTasks } from '../data/mockData';
import { formatLongDate, formatShortDate, isPastDue, isToday } from '../utils/date';

export function DashboardPage() {
  const tasksDueToday = mockTasks.filter((task) => isToday(task.dueDate) && task.status !== 'Completed');
  const completedTasks = mockTasks.filter((task) => task.status === 'Completed');
  const overdueTasks = mockTasks.filter((task) => isPastDue(task.dueDate) && task.status !== 'Completed');
  const bigThree = mockTasks.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-md bg-brand-black p-6 text-white shadow-premium md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">{formatLongDate()}</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">Good morning, John</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-300">
              Your operating rhythm is ready: priorities, decisions, projects, and customer follow-ups in one view.
            </p>
          </div>
          <Link to="/tasks">
            <Button className="w-full sm:w-auto">
              <Plus size={18} />
              New Task
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tasks due today" value={tasksDueToday.length} icon={Clock3} caption="Open actions for today" />
        <StatCard label="Completed tasks" value={completedTasks.length} icon={CheckCircle2} caption="Finished and recorded" />
        <StatCard label="Overdue tasks" value={overdueTasks.length} icon={TriangleAlert} caption="Needs executive attention" />
        <StatCard label="Customers" value={mockCustomers.length} icon={BriefcaseBusiness} caption="CRM relationships tracked" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-brand-black">Today's Big 3</h2>
                <p className="mt-1 text-sm text-gray-500">The actions most likely to move the day forward.</p>
              </div>
              <Target className="text-brand-orange" size={22} />
            </div>
            <div className="mt-5 grid gap-3">
              {bigThree.map((task, index) => (
                <div key={task.id} className="flex gap-4 rounded-md bg-gray-50 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-black text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-brand-black">{task.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-brand-black">Project progress</h2>
            <div className="mt-5 space-y-5">
              {mockProjects.map((project) => (
                <div key={project.id}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-brand-black">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.completedTasks} of {project.totalTasks} tasks complete</p>
                    </div>
                    <span className="text-sm font-black text-brand-black">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarClock size={20} className="text-brand-orange" />
              <h2 className="text-lg font-black text-brand-black">Upcoming meetings</h2>
            </div>
            <div className="mt-5 space-y-3">
              {mockMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-md bg-gray-50 p-4">
                  <p className="font-bold text-brand-black">{meeting.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{meeting.time} - {meeting.location}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-brand-orange" />
              <h2 className="text-lg font-black text-brand-black">Customer follow-ups</h2>
            </div>
            <div className="mt-5 space-y-3">
              {mockFollowUps.map((followUp) => (
                <div key={followUp.id} className="rounded-md bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-black">{followUp.customer}</p>
                      <p className="mt-1 text-sm text-gray-500">{followUp.note}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-600">{followUp.status}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-brand-orange">
                    {formatShortDate(followUp.dueDate)} - {followUp.channel}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquareText size={20} className="text-brand-orange" />
              <h2 className="text-lg font-black text-brand-black">Quick notes</h2>
            </div>
            <div className="mt-5 space-y-3">
              {mockNotes.map((note) => (
                <div key={note.id} className="rounded-md bg-gray-50 p-4">
                  <p className="font-bold text-brand-black">{note.title}</p>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{note.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
