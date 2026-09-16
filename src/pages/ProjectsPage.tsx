import { Cloud, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';
import { StatCard } from '../components/StatCard';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import type { Project } from '../types';
import { withProjectTaskStats } from '../utils/projects';

type ProjectDraft = Omit<Project, 'id' | 'progress' | 'totalTasks' | 'completedTasks'>;

const statusOptions: Project['status'][] = ['Planning', 'Active', 'At Risk', 'Completed'];

const emptyDraft: ProjectDraft = {
  name: '',
  description: '',
  status: 'Active',
  dueDate: new Date().toISOString().slice(0, 10),
  owner: 'John',
  client: 'Internal',
};

export function ProjectsPage() {
  const { projects, createProject, syncError, syncing, syncFromCloud } = useProjects();
  const { tasks } = useTasks();
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);

  const projectsWithStats = useMemo(() => withProjectTaskStats(projects, tasks), [projects, tasks]);

  const summary = useMemo(() => {
    return {
      active: projectsWithStats.filter((project) => project.status === 'Active').length,
      atRisk: projectsWithStats.filter((project) => project.status === 'At Risk').length,
      completed: projectsWithStats.filter((project) => project.status === 'Completed').length,
      tasks: projectsWithStats.reduce((total, project) => total + project.totalTasks, 0),
    };
  }, [projectsWithStats]);

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    createProject({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      owner: draft.owner.trim() || 'John',
      client: draft.client.trim() || 'Internal',
    });
    setDraft(emptyDraft);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Projects</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Project portfolio</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Create real projects, assign tasks to them, and track progress from live execution data.
          </p>
        </div>
        <div className="rounded-md bg-brand-black px-4 py-3 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Total task load</p>
          <p className="mt-1 text-2xl font-black">{summary.tasks}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active" value={summary.active} icon={Cloud} caption="Projects in motion" />
        <StatCard label="At risk" value={summary.atRisk} icon={TriangleAlert} caption="Needs attention" />
        <StatCard label="Completed" value={summary.completed} icon={RefreshCw} caption="Finished projects" />
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
            <p className="font-bold text-brand-black">{syncError ? 'Project sync needs attention' : 'Project cloud sync'}</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {syncError || (syncing ? 'Syncing projects with Supabase...' : 'Signed-in devices can share projects through Supabase.')}
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

      <form onSubmit={handleCreateProject} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-brand-black">Create project</h2>
            <p className="mt-1 text-sm text-gray-500">Add a real initiative before assigning tasks to it.</p>
          </div>
          <Plus className="text-brand-orange" size={22} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Project name</span>
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="Enter project name"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Client</span>
            <input
              value={draft.client}
              onChange={(event) => setDraft({ ...draft, client: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="Internal or customer name"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="What outcome should this project create?"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Status</span>
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as Project['status'] })}
              className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Due date</span>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Owner</span>
            <input
              value={draft.owner}
              onChange={(event) => setDraft({ ...draft, owner: event.target.value })}
              className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
              placeholder="Project owner"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit">
            <Plus size={16} />
            Create project
          </Button>
        </div>
      </form>

      {projectsWithStats.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {projectsWithStats.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-black text-brand-black">No live projects yet</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Create your first project, then assign tasks to it from the Tasks page.
          </p>
        </section>
      )}
    </div>
  );
}
