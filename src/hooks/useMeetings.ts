import { useEffect, useRef, useState } from 'react';
import { deleteCloudMeeting, loadCloudMeetings, saveCloudMeeting } from '../services/syncService';
import type { Meeting } from '../types';
import { sortMeetings } from '../utils/sortRecords';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type DraftMeeting = Omit<Meeting, 'id'>;

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

export function useMeetings() {
  const { cloudReady, user } = useAuth();
  const [meetings, setMeetings] = usePersistentState<Meeting[]>('ens.meetings.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);

  function syncFromCloud(seedMeetings = meetings) {
    if (!cloudReady || !user) {
      return;
    }

    setSyncError('');
    setSyncing(true);

    loadCloudMeetings()
      .then((cloudMeetings) => {
        if (cloudMeetings.length > 0) {
          setMeetings(sortMeetings(cloudMeetings));
          return;
        }

        void Promise.all(seedMeetings.map((meeting) => saveCloudMeeting(meeting)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Meetings cloud sync failed.'));
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
  }, [cloudReady, meetings, setMeetings, user]);

  function createMeeting(draft: DraftMeeting) {
    const meeting: Meeting = {
      ...draft,
      id: crypto.randomUUID(),
    };

    setMeetings((current) => sortMeetings([meeting, ...current]));
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudMeeting(meeting).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Meeting was saved locally but cloud sync failed.'));
      });
    }
  }

  function deleteMeeting(meetingId: string) {
    setMeetings((current) => current.filter((meeting) => meeting.id !== meetingId));
    if (cloudReady && user) {
      setSyncError('');
      void deleteCloudMeeting(meetingId).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Meeting was deleted locally but cloud sync failed.'));
      });
    }
  }

  return {
    meetings,
    createMeeting,
    deleteMeeting,
    syncError,
    syncing,
    syncFromCloud,
  };
}
