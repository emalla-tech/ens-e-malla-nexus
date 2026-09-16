import { useEffect, useRef, useState } from 'react';
import { deleteCloudNote, loadCloudNotes, saveCloudNote } from '../services/syncService';
import type { QuickNote } from '../types';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type DraftNote = Omit<QuickNote, 'id' | 'updatedAt'>;

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

export function useNotes() {
  const { cloudReady, user } = useAuth();
  const [notes, setNotes] = usePersistentState<QuickNote[]>('ens.notes.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);

  function syncFromCloud(seedNotes = notes) {
    if (!cloudReady || !user) {
      return;
    }

    setSyncError('');
    setSyncing(true);

    loadCloudNotes()
      .then((cloudNotes) => {
        if (cloudNotes.length > 0) {
          setNotes(cloudNotes);
          return;
        }

        void Promise.all(seedNotes.map((note) => saveCloudNote(note)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Notes cloud sync failed.'));
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
  }, [cloudReady, notes, setNotes, user]);

  function createNote(draft: DraftNote) {
    const note: QuickNote = {
      ...draft,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setNotes((current) => [note, ...current]);
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudNote(note).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Note was saved locally but cloud sync failed.'));
      });
    }
  }

  function updateNote(noteId: string, updates: DraftNote) {
    const updatedAt = new Date().toISOString().slice(0, 10);
    const nextNote = notes.find((note) => note.id === noteId);
    setNotes((current) =>
      current.map((note) => (note.id === noteId ? { ...note, ...updates, updatedAt } : note)),
    );

    if (nextNote && cloudReady && user) {
      setSyncError('');
      void saveCloudNote({ ...nextNote, ...updates, updatedAt }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Note was updated locally but cloud sync failed.'));
      });
    }
  }

  function deleteNote(noteId: string) {
    setNotes((current) => current.filter((note) => note.id !== noteId));
    if (cloudReady && user) {
      setSyncError('');
      void deleteCloudNote(noteId).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Note was deleted locally but cloud sync failed.'));
      });
    }
  }

  return {
    notes,
    createNote,
    updateNote,
    deleteNote,
    syncError,
    syncing,
    syncFromCloud,
  };
}
