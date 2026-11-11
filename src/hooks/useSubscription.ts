import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceSubscription, WorkspaceUsage } from '../types';
import { loadSubscription, loadWorkspaceUsage } from '../services/subscriptionService';
import { useWorkspace } from './useWorkspace';

export function useSubscription() {
  const { activeWorkspace } = useWorkspace();
  const [subscription, setSubscription] = useState<WorkspaceSubscription | null>(null);
  const [usage, setUsage] = useState<WorkspaceUsage>({ members: 0, customers: 0, projects: 0, storageMb: 0 });
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const refresh = useCallback(() => { if (!activeWorkspace) return; setLoading(true); setError(''); Promise.all([loadSubscription(activeWorkspace.id, activeWorkspace.plan), loadWorkspaceUsage(activeWorkspace.id)]).then(([nextSubscription, nextUsage]) => { setSubscription(nextSubscription); setUsage(nextUsage); }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Subscription data failed to load.')).finally(() => setLoading(false)); }, [activeWorkspace]);
  useEffect(refresh, [refresh]);
  return { subscription, usage, loading, error, refresh };
}
