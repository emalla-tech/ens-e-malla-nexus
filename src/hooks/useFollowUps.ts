import { useEffect, useRef, useState } from 'react';
import { loadCloudFollowUps, saveCloudFollowUp } from '../services/syncService';
import type { FollowUp } from '../types';
import { getLiveFollowUps } from '../utils/crm';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type DraftFollowUp = Omit<FollowUp, 'id'>;

function getSyncErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useFollowUps() {
  const { cloudReady, user } = useAuth();
  const [storedFollowUps, setFollowUps] = usePersistentState<FollowUp[]>('ens.followUps.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);
  const followUps = getLiveFollowUps(storedFollowUps);

  function syncFromCloud(seedFollowUps = followUps) {
    if (!cloudReady || !user) return;

    setSyncError('');
    setSyncing(true);
    loadCloudFollowUps()
      .then((cloudFollowUps) => {
        if (cloudFollowUps.length > 0) {
          setFollowUps(cloudFollowUps);
          return;
        }
        void Promise.all(seedFollowUps.map((followUp) => saveCloudFollowUp(followUp)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Follow-up cloud sync failed.'));
        loadedCloudUser.current = null;
      })
      .finally(() => setSyncing(false));
  }

  useEffect(() => {
    if (!cloudReady || !user || loadedCloudUser.current === user.id) return;
    loadedCloudUser.current = user.id;
    syncFromCloud();
  }, [cloudReady, user]);

  function createFollowUp(draft: DraftFollowUp) {
    const followUp: FollowUp = { ...draft, id: crypto.randomUUID() };
    setFollowUps((current) => [followUp, ...getLiveFollowUps(current)]);
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudFollowUp(followUp).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Follow-up was saved locally but cloud sync failed.'));
      });
    }
    return followUp;
  }

  function completeFollowUp(followUpId: string) {
    const nextFollowUp = followUps.find((followUp) => followUp.id === followUpId);
    setFollowUps((current) =>
      getLiveFollowUps(current).map((followUp) =>
        followUp.id === followUpId ? { ...followUp, status: 'Completed' } : followUp,
      ),
    );
    if (nextFollowUp && cloudReady && user) {
      setSyncError('');
      void saveCloudFollowUp({ ...nextFollowUp, status: 'Completed' }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Follow-up was completed locally but cloud sync failed.'));
      });
    }
  }

  return { followUps, createFollowUp, completeFollowUp, syncError, syncing, syncFromCloud };
}
