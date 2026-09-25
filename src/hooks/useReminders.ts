import { useEffect, useRef, useState } from 'react';
import { deleteCloudReminder, loadCloudReminders, saveCloudReminder } from '../services/syncService';
import type { Reminder } from '../types';
import { sortReminders } from '../utils/sortRecords';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type ReminderDraft = Omit<Reminder, 'id' | 'createdAt'>;

function message(error: unknown, fallback: string) {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : fallback;
}

export function useReminders() {
  const { cloudReady, user } = useAuth();
  const [stored, setStored] = usePersistentState<Reminder[]>('ens.reminders.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedUser = useRef<string | null>(null);
  const reminders = sortReminders(stored);

  function syncFromCloud(seed = stored) {
    if (!cloudReady || !user) return;
    setSyncError(''); setSyncing(true);
    loadCloudReminders().then((cloud) => {
      if (cloud.length) setStored(cloud);
      else void Promise.all(seed.map(saveCloudReminder));
    }).catch((error) => { setSyncError(message(error, 'Reminders cloud sync failed.')); loadedUser.current = null; })
      .finally(() => setSyncing(false));
  }

  useEffect(() => {
    if (!cloudReady || !user || loadedUser.current === user.id) return;
    loadedUser.current = user.id; syncFromCloud();
  }, [cloudReady, user]);

  function persist(reminder: Reminder, fallback: string) {
    if (!cloudReady || !user) return;
    setSyncError('');
    void saveCloudReminder(reminder).catch((error) => setSyncError(message(error, fallback)));
  }

  function createReminder(draft: ReminderDraft) {
    const reminder = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setStored((current) => [reminder, ...current]);
    persist(reminder, 'Reminder was saved locally but cloud sync failed.');
  }

  function updateReminder(id: string, updates: Partial<ReminderDraft>) {
    const reminder = stored.find((item) => item.id === id);
    if (!reminder) return;
    const updated = { ...reminder, ...updates };
    setStored((current) => current.map((item) => item.id === id ? updated : item));
    persist(updated, 'Reminder was updated locally but cloud sync failed.');
  }

  function deleteReminder(id: string) {
    setStored((current) => current.filter((item) => item.id !== id));
    if (cloudReady && user) void deleteCloudReminder(id).catch((error) => setSyncError(message(error, 'Reminder was deleted locally but cloud sync failed.')));
  }

  return { reminders, createReminder, updateReminder, deleteReminder, syncError, syncing, syncFromCloud };
}
