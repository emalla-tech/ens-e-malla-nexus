import { useEffect, useRef, useState } from 'react';
import { deleteCloudProject, loadCloudProjects, saveCloudProject } from '../services/syncService';
import type { Project } from '../types';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type DraftProject = Omit<Project, 'id' | 'progress' | 'totalTasks' | 'completedTasks'>;

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

export function useProjects() {
  const { cloudReady, user } = useAuth();
  const [projects, setProjects] = usePersistentState<Project[]>('ens.projects.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);

  function syncFromCloud(seedProjects = projects) {
    if (!cloudReady || !user) {
      return;
    }

    setSyncError('');
    setSyncing(true);

    loadCloudProjects()
      .then((cloudProjects) => {
        if (cloudProjects.length > 0) {
          setProjects(cloudProjects);
          return;
        }

        void Promise.all(seedProjects.map((project) => saveCloudProject(project)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Project cloud sync failed.'));
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
  }, [cloudReady, setProjects, projects, user]);

  function createProject(draft: DraftProject) {
    const project: Project = {
      ...draft,
      id: crypto.randomUUID(),
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
    };

    setProjects((current) => [project, ...current]);
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudProject(project).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Project was saved locally but cloud sync failed.'));
      });
    }
  }

  function updateProject(projectId: string, updates: DraftProject) {
    const nextProject = projects.find((project) => project.id === projectId);
    setProjects((current) =>
      current.map((project) => (project.id === projectId ? { ...project, ...updates } : project)),
    );

    if (nextProject && cloudReady && user) {
      setSyncError('');
      void saveCloudProject({ ...nextProject, ...updates }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Project was updated locally but cloud sync failed.'));
      });
    }
  }

  function deleteProject(projectId: string) {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (cloudReady && user) {
      setSyncError('');
      void deleteCloudProject(projectId).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Project was deleted locally but cloud sync failed.'));
      });
    }
  }

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
    syncError,
    syncing,
    syncFromCloud,
  };
}
