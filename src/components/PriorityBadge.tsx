import type { Priority, TaskStatus } from '../types';
import { cn } from '../utils/cn';

const priorityStyles: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-blue-100 text-blue-800',
  Low: 'bg-gray-100 text-gray-700',
};

const statusStyles: Record<TaskStatus, string> = {
  Pending: 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
};

interface BadgeProps {
  label: Priority | TaskStatus;
  type: 'priority' | 'status';
}

export function Badge({ label, type }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        type === 'priority' ? priorityStyles[label as Priority] : statusStyles[label as TaskStatus],
      )}
    >
      {label}
    </span>
  );
}
