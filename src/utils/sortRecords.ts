import type { Customer, FollowUp, Meeting, Project, Task } from '../types';

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((first, second) =>
    first.dueDate.localeCompare(second.dueDate)
      || second.createdAt.localeCompare(first.createdAt)
      || first.id.localeCompare(second.id),
  );
}

export function sortProjects(projects: Project[]) {
  return [...projects].sort((first, second) => first.dueDate.localeCompare(second.dueDate));
}

export function sortCustomers(customers: Customer[]) {
  return [...customers].sort((first, second) => first.nextFollowUp.localeCompare(second.nextFollowUp));
}

export function sortFollowUps(followUps: FollowUp[]) {
  return [...followUps].sort((first, second) => first.dueDate.localeCompare(second.dueDate));
}

export function sortMeetings(meetings: Meeting[]) {
  return [...meetings].sort((first, second) =>
    `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
  );
}
