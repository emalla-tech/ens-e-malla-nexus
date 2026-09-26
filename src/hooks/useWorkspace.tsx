import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Workspace } from '../types';
import { getStoredWorkspaceId, loadWorkspaces, storeWorkspaceId } from '../services/workspaceService';
import { useAuth } from './useAuth';

interface Value { workspaces: Workspace[]; activeWorkspace: Workspace | null; loading: boolean; error: string; switchWorkspace: (id: string) => void; refresh: () => void; }
const WorkspaceContext = createContext<Value>({ workspaces: [], activeWorkspace: null, loading: false, error: '', switchWorkspace: () => undefined, refresh: () => undefined });

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); const [workspaces, setWorkspaces] = useState<Workspace[]>([]); const [activeId, setActiveId] = useState(getStoredWorkspaceId); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  function refresh() { if (!user) { setWorkspaces([]); return; } setLoading(true); setError(''); loadWorkspaces().then((items) => { setWorkspaces(items); const selected = items.find((item) => item.id === activeId) ?? items[0]; if (selected) { setActiveId(selected.id); storeWorkspaceId(selected.id); } }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Workspace loading failed.')).finally(() => setLoading(false)); }
  useEffect(refresh, [user?.id]);
  function switchWorkspace(id: string) {
    if (id === activeId) return;
    ['ens.tasks.v1', 'ens.projects.v1', 'ens.customers.v1', 'ens.followUps.v1', 'ens.notes.v1', 'ens.meetings.v1', 'ens.goals.v1', 'ens.reminders.v1', 'ens.finance.transactions.v1', 'ens.finance.invoices.v1'].forEach((key) => window.localStorage.removeItem(key));
    storeWorkspaceId(id); setActiveId(id); window.location.reload();
  }
  const value = useMemo(() => ({ workspaces, activeWorkspace: workspaces.find((item) => item.id === activeId) ?? null, loading, error, switchWorkspace, refresh }), [workspaces, activeId, loading, error]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() { return useContext(WorkspaceContext); }
