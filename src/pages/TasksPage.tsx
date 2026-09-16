import { Cloud, Filter, RefreshCw, Search, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { withProjectTaskStats } from '../utils/projects';
import type { Priority, Task, TaskStatus } from '../types';

type PriorityFilter = Priority | 'All';
type StatusFilter = TaskStatus | 'All';

export function TasksPage() {
  const {
    tasks,
    taskSummary,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    syncError,
    syncing,
    syncFromCloud,
  } = useTasks();
  const { projects } = useProjects();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<PriorityFilter>('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [projectId, setProjectId] = useState('All');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesQuery = `${task.title} ${task.description} ${task.assignee}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesPriority = priority === 'All' || task.priority === priority;
      const matchesStatus = status === 'All' || task.status === status;
      const matchesProject = projectId === 'All' || task.projectId === projectId;

      return matchesQuery && matchesPriority && matchesStatus && matchesProject;
    });
  }, [tasks, query, priority, status, projectId]);

  const projectsWithStats = useMemo(() => withProjectTaskStats(projects, tasks), [projects, tasks]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Tasks</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Executive task control</h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Create, assign, prioritize, schedule, and complete the work that drives the operating day.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-md bg-white p-2 shadow-sm">
          <div className="px-3 py-2 text-center">
            <p className="text-lg font-black text-brand-black">{taskSummary.dueToday}</p>
            <p className="text-xs text-gray-500">Due</p>
          </div>
          <div className="px-3 py-2 text-center">
            <p className="text-lg font-black text-brand-black">{taskSummary.completed}</p>
            <p className="text-xs text-gray-500">Done</p>
          </div>
          <div className="px-3 py-2 text-center">
            <p className="text-lg font-black text-brand-black">{taskSummary.overdue}</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </div>
        </div>
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
            <p className="font-bold text-brand-black">{syncError ? 'Cloud sync needs attention' : 'Cloud sync'}</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {syncError || (syncing ? 'Syncing tasks with Supabase...' : 'Signed-in devices can share tasks through Supabase.')}
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

      <TaskForm
        projects={projectsWithStats}
        editingTask={editingTask}
        onSubmit={(draft) => {
          if (editingTask) {
            updateTask(editingTask.id, draft);
            setEditingTask(null);
            return;
          }
          createTask(draft);
        }}
        onCancelEdit={() => setEditingTask(null)}
      />

      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_repeat(3,180px)]">
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3">
            <Search size={18} className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full border-0 bg-transparent text-sm outline-none"
              placeholder="Search tasks"
            />
          </label>

          <label className="flex min-h-11 items-center gap-2 rounded-md border border-gray-200 px-3">
            <Filter size={17} className="text-gray-400" />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as PriorityFilter)}
              className="w-full border-0 bg-transparent text-sm outline-none"
              aria-label="Filter by priority"
            >
              <option>All</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="min-h-11 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none"
            aria-label="Filter by status"
          >
            <option>All</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>

          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="min-h-11 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none"
            aria-label="Filter by project"
          >
            <option value="All">All projects</option>
            <option value="">No project</option>
            {projectsWithStats.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <TaskList
        tasks={filteredTasks}
        projects={projectsWithStats}
        onEdit={setEditingTask}
        onDelete={deleteTask}
        onComplete={completeTask}
      />
    </div>
  );
}
