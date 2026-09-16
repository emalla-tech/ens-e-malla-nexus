import { ArrowLeft, CalendarDays, CheckCircle2, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../components/PriorityBadge';
import { ProgressBar } from '../components/ProgressBar';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { formatShortDate } from '../utils/date';
import { getLiveTasks, withProjectTaskStats } from '../utils/projects';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const projectsWithStats = withProjectTaskStats(projects, tasks);
  const project = projectsWithStats.find((item) => item.id === projectId);

  if (!project) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-brand-black">Project not found</h1>
        <Link className="mt-4 inline-flex font-semibold text-brand-orange" to="/projects">
          Back to projects
        </Link>
      </div>
    );
  }

  const projectTasks = getLiveTasks(tasks).filter((task) => task.projectId === project.id);

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-brand-orange">
        <ArrowLeft size={17} />
        Back to projects
      </Link>

      <section className="rounded-md bg-brand-black p-6 text-white shadow-premium md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">{project.status}</p>
            <h1 className="mt-3 text-3xl font-black">{project.name}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-gray-300">{project.description}</p>
          </div>
          <div className="min-w-56 rounded-md bg-white/10 p-4">
            <p className="text-sm text-gray-300">Progress</p>
            <p className="mt-1 text-3xl font-black">{project.progress}%</p>
            <div className="mt-3">
              <ProgressBar value={project.progress} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <UserRound className="text-brand-orange" size={22} />
          <p className="mt-3 text-sm text-gray-500">Owner</p>
          <p className="mt-1 font-black text-brand-black">{project.owner}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <CalendarDays className="text-brand-orange" size={22} />
          <p className="mt-3 text-sm text-gray-500">Due date</p>
          <p className="mt-1 font-black text-brand-black">{formatShortDate(project.dueDate)}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <CheckCircle2 className="text-brand-orange" size={22} />
          <p className="mt-3 text-sm text-gray-500">Task completion</p>
          <p className="mt-1 font-black text-brand-black">
            {project.completedTasks}/{project.totalTasks}
          </p>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-brand-black">Project tasks</h2>
        <div className="mt-5 grid gap-3">
          {projectTasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-3 rounded-md bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-brand-black">{task.title}</p>
                <p className="mt-1 text-sm text-gray-500">{task.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={task.priority} type="priority" />
                <Badge label={task.status} type="status" />
              </div>
            </div>
          ))}
          {projectTasks.length === 0 ? (
            <p className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-500">
              No live tasks are assigned to this project yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
