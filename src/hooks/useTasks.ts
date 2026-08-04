import { mockTasks } from '../data/mockData';
import { deleteCloudTask, loadCloudTasks, saveCloudTask } from '../services/syncService';
import { usePersistentState } from './usePersistentState';
import { useAuth } from './useAuth';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Task } from '../types';

type DraftTask = Omit<Task, 'id' | 'createdAt'>;

function getSyncErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function useTasks() {
  const { cloudReady, user } = useAuth();
  const [tasks, setTasks] = usePersistentState<Task[]>('ens.tasks.v1', mockTasks);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);

  function syncFromCloud(seedTasks = tasks) {
    if (!cloudReady || !user) {
      return;
    }

    setSyncError('');
    setSyncing(true);

    loadCloudTasks()
      .then((cloudTasks) => {
        if (cloudTasks.length > 0) {
          setTasks(cloudTasks);
          return;
        }

        void Promise.all(seedTasks.map((task) => saveCloudTask(task)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Cloud sync failed.'));
        loadedCloudUser.current = null;
      })
      .finally(() => {
        setSyncing(false);
      });
  }

  useEffect(() => {
    if (!cloudReady || !user || loadedCloudUser.current === user.id) {
      return;
    }

    loadedCloudUser.current = user.id;
    syncFromCloud();
  }, [cloudReady, setTasks, tasks, user]);

  const taskSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return {
      dueToday: tasks.filter((task) => task.dueDate === today && task.status !== 'Completed').length,
      completed: tasks.filter((task) => task.status === 'Completed').length,
      overdue: tasks.filter((task) => task.dueDate < today && task.status !== 'Completed').length,
      total: tasks.length,
    };
  }, [tasks]);

  function createTask(draft: DraftTask) {
    const newTask: Task = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setTasks((current) => [newTask, ...current]);
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudTask(newTask).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Task was saved locally but cloud sync failed.'));
      });
    }
  }

  function updateTask(taskId: string, updates: DraftTask) {
    const nextTask = tasks.find((task) => task.id === taskId);
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    );

    if (nextTask && cloudReady && user) {
      setSyncError('');
      void saveCloudTask({ ...nextTask, ...updates }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Task was updated locally but cloud sync failed.'));
      });
    }
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (cloudReady && user) {
      setSyncError('');
      void deleteCloudTask(taskId).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Task was deleted locally but cloud sync failed.'));
      });
    }
  }

  function completeTask(taskId: string) {
    const nextTask = tasks.find((task) => task.id === taskId);
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status: 'Completed' } : task)),
    );

    if (nextTask && cloudReady && user) {
      setSyncError('');
      void saveCloudTask({ ...nextTask, status: 'Completed' }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Task was completed locally but cloud sync failed.'));
      });
    }
  }

  return {
    tasks,
    taskSummary,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    syncError,
    syncing,
    syncFromCloud,
  };
}
