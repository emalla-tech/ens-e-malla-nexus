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
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';
import { usePersistentState } from '../hooks/usePersistentState';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { loadCloudFollowUps } from '../services/syncService';
import type { FollowUp, Task } from '../types';
import { formatLongDate, formatShortDate, isPastDue, isToday } from '../utils/date';
import { getLiveTasks, isSeedFollowUpId, withProjectTaskStats } from '../utils/projects';

const priorityRank: Record<Task['priority'], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export function DashboardPage() {
  const { cloudReady, user } = useAuth();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const [followUps, setFollowUps] = usePersistentState<FollowUp[]>('ens.followUps.v1', []);
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
        }
      })
      .catch(() => {
        loadedFollowUpsUser.current = null;
      });
  }, [cloudReady, setFollowUps, user]);

  const liveTasks = useMemo(() => getLiveTasks(tasks), [tasks]);
  const liveFollowUps = useMemo(() => followUps.filter((followUp) => !isSeedFollowUpId(followUp.id)), [followUps]);

  const tasksDueToday = liveTasks.filter((task) => isToday(task.dueDate) && task.status !== 'Completed');
  const completedTasks = liveTasks.filter((task) => task.status === 'Completed');
  const overdueTasks = liveTasks.filter((task) => isPastDue(task.dueDate) && task.status !== 'Completed');
  const customerCount = new Set(liveFollowUps.map((followUp) => followUp.customerId || followUp.customer)).size;

  const bigThree = useMemo(() => {
    return liveTasks
      .filter((task) => task.status !== 'Completed' && task.status !== 'Cancelled')
      .sort((first, second) => {
        const todayScore = Number(isToday(second.dueDate)) - Number(isToday(first.dueDate));
        if (todayScore !== 0) {
          return todayScore;
        }

        const overdueScore = Number(isPastDue(second.dueDate)) - Number(isPastDue(first.dueDate));
        if (overdueScore !== 0) {
          return overdueScore;
        }

        const priorityScore = priorityRank[first.priority] - priorityRank[second.priority];
        if (priorityScore !== 0) {
          return priorityScore;
        }

        return first.dueDate.localeCompare(second.dueDate);
      })
      .slice(0, 3);
  }, [liveTasks]);

  const projectProgress = useMemo(() => {
    return withProjectTaskStats(projects, liveTasks)
      .filter((project) => project.totalTasks > 0)
      .sort((first, second) => second.totalTasks - first.totalTasks)
      .slice(0, 4);
  }, [liveTasks, projects]);

  const activeFollowUps = liveFollowUps
    .filter((followUp) => followUp.status !== 'Completed')
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
    .slice(0, 4);
  const greeting = getTimeGreeting();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-md bg-brand-black p-6 text-white shadow-premium md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">{formatLongDate()}</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">{greeting}, John</h1>
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
        <StatCard label="Active projects" value={projectProgress.length} icon={BriefcaseBusiness} caption="Built from real tasks" />
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
              {bigThree.length > 0 ? bigThree.map((task, index) => (
                <div key={task.id} className="flex gap-4 rounded-md bg-gray-50 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-black text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-brand-black">{task.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                  </div>
                </div>
              )) : (
                <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                  No live tasks yet. Create your first task and it will appear here.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-brand-black">Project progress</h2>
            <div className="mt-5 space-y-5">
              {projectProgress.length > 0 ? projectProgress.map((project) => (
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
              )) : (
                <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                  No live project activity yet. Assign tasks to projects to build this progress view.
                </p>
              )}
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
              <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                No live meetings connected yet. Calendar sync can be added next.
              </p>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-brand-orange" />
                <h2 className="text-lg font-black text-brand-black">Customer follow-ups</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                {customerCount} customers
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {activeFollowUps.length > 0 ? activeFollowUps.map((followUp) => (
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
              )) : (
                <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                  No live CRM follow-ups yet. Create one from Customers and it will appear here.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquareText size={20} className="text-brand-orange" />
              <h2 className="text-lg font-black text-brand-black">Quick notes</h2>
            </div>
            <div className="mt-5 space-y-3">
              <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
                No live notes connected yet. Notes can be made editable in the next build.
              </p>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
