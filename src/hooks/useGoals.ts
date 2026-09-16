import { useEffect, useRef, useState } from 'react';
import { deleteCloudGoal, loadCloudGoals, saveCloudGoal } from '../services/syncService';
import type { Goal } from '../types';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type DraftGoal = Omit<Goal, 'id'>;

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

export function useGoals() {
  const { cloudReady, user } = useAuth();
  const [goals, setGoals] = usePersistentState<Goal[]>('ens.goals.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);

  function syncFromCloud(seedGoals = goals) {
    if (!cloudReady || !user) {
      return;
    }

    setSyncError('');
    setSyncing(true);

    loadCloudGoals()
      .then((cloudGoals) => {
        if (cloudGoals.length > 0) {
          setGoals(cloudGoals);
          return;
        }

        void Promise.all(seedGoals.map((goal) => saveCloudGoal(goal)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Goals cloud sync failed.'));
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
  }, [cloudReady, goals, setGoals, user]);

  function createGoal(draft: DraftGoal) {
    const goal: Goal = {
      ...draft,
      id: crypto.randomUUID(),
      progress: Math.min(100, Math.max(0, draft.progress)),
    };

    setGoals((current) => [goal, ...current]);
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudGoal(goal).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Goal was saved locally but cloud sync failed.'));
      });
    }
  }

  function updateGoal(goalId: string, updates: DraftGoal) {
    const nextGoal = goals.find((goal) => goal.id === goalId);
    const cleanUpdates = {
      ...updates,
      progress: Math.min(100, Math.max(0, updates.progress)),
    };

    setGoals((current) =>
      current.map((goal) => (goal.id === goalId ? { ...goal, ...cleanUpdates } : goal)),
    );

    if (nextGoal && cloudReady && user) {
      setSyncError('');
      void saveCloudGoal({ ...nextGoal, ...cleanUpdates }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Goal was updated locally but cloud sync failed.'));
      });
    }
  }

  function deleteGoal(goalId: string) {
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    if (cloudReady && user) {
      setSyncError('');
      void deleteCloudGoal(goalId).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Goal was deleted locally but cloud sync failed.'));
      });
    }
  }

  return {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    syncError,
    syncing,
    syncFromCloud,
  };
}
