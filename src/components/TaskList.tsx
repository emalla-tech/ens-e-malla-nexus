import { Check, Edit3, Trash2 } from 'lucide-react';
import type { Project, Task } from '../types';
import { formatShortDate } from '../utils/date';
import { Badge } from './PriorityBadge';
import { Button } from './Button';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export function TaskList({ tasks, projects, onEdit, onDelete, onComplete }: TaskListProps) {
  const projectName = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.name ?? 'Unassigned';

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-lg font-bold text-brand-black">No tasks found</p>
        <p className="mt-2 text-sm text-gray-500">Adjust your filters or create a new task.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[960px] text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-4">Task</th>
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Due</th>
              <th className="px-5 py-4">Project</th>
              <th className="px-5 py-4">Owner</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <tr key={task.id} className="align-top">
                <td className="px-5 py-4">
                  <p className="font-bold text-brand-black">{task.title}</p>
                  <p className="mt-1 max-w-md text-sm text-gray-500">{task.description}</p>
                  <p className="mt-2 text-xs font-semibold text-brand-orange">{task.schedule}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge label={task.priority} type="priority" />
                </td>
                <td className="px-5 py-4">
                  <Badge label={task.status} type="status" />
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{formatShortDate(task.dueDate)}</td>
                <td className="px-5 py-4 text-sm font-medium text-gray-700">{projectName(task.projectId)}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{task.assignee}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-9 px-0"
                      onClick={() => onComplete(task.id)}
                      disabled={task.status === 'Completed'}
                      aria-label={`Complete ${task.title}`}
                    >
                      <Check size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 w-9 px-0"
                      onClick={() => onEdit(task)}
                      aria-label={`Edit ${task.title}`}
                    >
                      <Edit3 size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="h-9 w-9 px-0"
                      onClick={() => onDelete(task.id)}
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 xl:hidden">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-md border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-black text-brand-black">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{task.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={task.priority} type="priority" />
                <Badge label={task.status} type="status" />
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <span>{formatShortDate(task.dueDate)}</span>
              <span>{projectName(task.projectId)}</span>
              <span>{task.assignee}</span>
              <span>{task.schedule}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onComplete(task.id)}
                disabled={task.status === 'Completed'}
              >
                <Check size={16} />
                Complete
              </Button>
              <Button type="button" variant="secondary" onClick={() => onEdit(task)}>
                <Edit3 size={16} />
                Edit
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete(task.id)}>
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
