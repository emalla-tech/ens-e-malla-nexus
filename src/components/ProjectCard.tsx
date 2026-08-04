import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Project } from '../types';
import { formatShortDate } from '../utils/date';
import { ProgressBar } from './ProgressBar';

interface ProjectCardProps {
  project: Project;
}

const statusStyles: Record<Project['status'], string> = {
  Planning: 'bg-gray-100 text-gray-700',
  Active: 'bg-emerald-100 text-emerald-800',
  'At Risk': 'bg-orange-100 text-orange-800',
  Completed: 'bg-brand-black text-white',
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[project.status]}`}>
            {project.status}
          </span>
          <h2 className="mt-4 text-xl font-black text-brand-black">{project.name}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">{project.description}</p>
        </div>
        <Link
          to={`/projects/${project.id}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gray-100 text-brand-black transition hover:bg-brand-orange hover:text-white"
          aria-label={`Open ${project.name}`}
        >
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">Progress</span>
          <span className="font-black text-brand-black">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-gray-500">Tasks</p>
          <p className="mt-1 font-black text-brand-black">
            {project.completedTasks}/{project.totalTasks}
          </p>
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-gray-500">Due date</p>
          <p className="mt-1 font-black text-brand-black">{formatShortDate(project.dueDate)}</p>
        </div>
      </div>
    </article>
  );
}
