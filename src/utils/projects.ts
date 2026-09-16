import type { Project, Task } from '../types';

export function isSeedTask(task: Task) {
  return /^task-\d+$/.test(task.id);
}

export function isSeedFollowUpId(id: string) {
  return /^follow-up-\d+$/.test(id);
}

export function getLiveTasks(tasks: Task[]) {
  return tasks.filter((task) => !isSeedTask(task));
}

export function withProjectTaskStats(projects: Project[], tasks: Task[]): Project[] {
  const liveTasks = getLiveTasks(tasks);

  return projects.map((project) => {
    const projectTasks = liveTasks.filter((task) => task.projectId === project.id);
    const completedTasks = projectTasks.filter((task) => task.status === 'Completed').length;
    const totalTasks = projectTasks.length;

    return {
      ...project,
      completedTasks,
      totalTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });
}
