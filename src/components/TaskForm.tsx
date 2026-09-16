import { useEffect, useState, type FormEvent } from 'react';
import type { DaySchedule, Priority, Project, Task, TaskStatus } from '../types';
import { Button } from './Button';

type TaskDraft = Omit<Task, 'id' | 'createdAt'>;

const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const statuses: TaskStatus[] = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const schedules: DaySchedule[] = ['Morning', 'Afternoon', 'Evening'];

const emptyDraft: TaskDraft = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Pending',
  dueDate: new Date().toISOString().slice(0, 10),
  projectId: '',
  assignee: 'John',
  schedule: 'Morning',
};

interface TaskFormProps {
  projects: Project[];
  editingTask: Task | null;
  onSubmit: (draft: TaskDraft) => void;
  onCancelEdit: () => void;
}

export function TaskForm({ projects, editingTask, onSubmit, onCancelEdit }: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);

  useEffect(() => {
    if (editingTask) {
      setDraft({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate,
        projectId: editingTask.projectId,
        assignee: editingTask.assignee,
        schedule: editingTask.schedule,
      });
      return;
    }

    setDraft((current) => ({ ...emptyDraft, projectId: projects[0]?.id ?? current.projectId }));
  }, [editingTask, projects]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      return;
    }

    onSubmit({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
    if (!editingTask) {
      setDraft({ ...emptyDraft, projectId: projects[0]?.id ?? emptyDraft.projectId });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-black text-brand-black">{editingTask ? 'Edit task' : 'Create task'}</h2>
          <p className="mt-1 text-sm text-gray-500">Capture the work, owner, priority, and schedule.</p>
        </div>
        {editingTask ? (
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            Cancel edit
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Task title</span>
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            placeholder="Enter task title"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Assignee</span>
          <input
            value={draft.assignee}
            onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}
            className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            placeholder="Owner"
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-gray-700">Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            className="min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
            placeholder="Add context, expected outcome, or next action"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Project</span>
          <select
            value={draft.projectId}
            onChange={(event) => setDraft({ ...draft, projectId: event.target.value })}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
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
          <span className="text-sm font-semibold text-gray-700">Priority</span>
          <select
            value={draft.priority}
            onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
          >
            {priorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Status</span>
          <select
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-gray-700">Schedule</span>
          <select
            value={draft.schedule}
            onChange={(event) => setDraft({ ...draft, schedule: event.target.value as DaySchedule })}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-orange-100"
          >
            {schedules.map((schedule) => (
              <option key={schedule}>{schedule}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit">{editingTask ? 'Save changes' : 'Create task'}</Button>
      </div>
    </form>
  );
}
