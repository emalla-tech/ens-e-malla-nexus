import type { Customer, FollowUp, Meeting, Project, Task } from '../types';
import { getLocalDateKey } from './date';

function compareOperationalDates(firstDate: string, secondDate: string) {
  const today = getLocalDateKey();
  const firstIsPast = firstDate < today;
  const secondIsPast = secondDate < today;

  if (firstIsPast !== secondIsPast) {
    return firstIsPast ? 1 : -1;
  }

  // Upcoming dates run forward; past dates run backward from the most recent.
  return firstIsPast
    ? secondDate.localeCompare(firstDate)
    : firstDate.localeCompare(secondDate);
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((first, second) =>
    compareOperationalDates(first.dueDate, second.dueDate)
      || second.createdAt.localeCompare(first.createdAt)
      || first.id.localeCompare(second.id),
  );
}

export function sortProjects(projects: Project[]) {
  return [...projects].sort((first, second) => compareOperationalDates(first.dueDate, second.dueDate));
}

export function sortCustomers(customers: Customer[]) {
  return [...customers].sort((first, second) => compareOperationalDates(first.nextFollowUp, second.nextFollowUp));
}

export function sortFollowUps(followUps: FollowUp[]) {
  return [...followUps].sort((first, second) => compareOperationalDates(first.dueDate, second.dueDate));
}

export function sortMeetings(meetings: Meeting[]) {
  return [...meetings].sort((first, second) => {
    const dateOrder = compareOperationalDates(first.date, second.date);
    if (dateOrder !== 0) return dateOrder;
    return first.date < getLocalDateKey()
      ? second.time.localeCompare(first.time)
      : first.time.localeCompare(second.time);
  });
}
