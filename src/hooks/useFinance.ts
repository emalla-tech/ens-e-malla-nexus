import { useEffect, useRef, useState } from 'react';
import { deleteCloudInvoice, deleteCloudTransaction, loadCloudInvoices, loadCloudTransactions, saveCloudInvoice, saveCloudTransaction } from '../services/syncService';
import type { FinanceTransaction, Invoice } from '../types';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type TransactionDraft = Omit<FinanceTransaction, 'id' | 'createdAt'>;
type InvoiceDraft = Omit<Invoice, 'id' | 'createdAt'>;
const errorMessage = (error: unknown, fallback: string) => error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : fallback;

export function useFinance() {
  const { cloudReady, user } = useAuth();
  const [transactions, setTransactions] = usePersistentState<FinanceTransaction[]>('ens.finance.transactions.v1', []);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('ens.finance.invoices.v1', []);
  const [syncError, setSyncError] = useState(''); const [syncing, setSyncing] = useState(false);
  const loadedUser = useRef<string | null>(null);

  function syncFromCloud() {
    if (!cloudReady || !user) return;
    setSyncError(''); setSyncing(true);
    Promise.all([loadCloudTransactions(), loadCloudInvoices()]).then(([cloudTransactions, cloudInvoices]) => {
      if (cloudTransactions.length) setTransactions(cloudTransactions); else void Promise.all(transactions.map(saveCloudTransaction));
      if (cloudInvoices.length) setInvoices(cloudInvoices); else void Promise.all(invoices.map(saveCloudInvoice));
    }).catch((error) => { setSyncError(errorMessage(error, 'Finance cloud sync failed.')); loadedUser.current = null; }).finally(() => setSyncing(false));
  }
  useEffect(() => { if (!cloudReady || !user || loadedUser.current === user.id) return; loadedUser.current = user.id; syncFromCloud(); }, [cloudReady, user]);

  function createTransaction(draft: TransactionDraft) { const item = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; setTransactions((current) => [item, ...current]); if (cloudReady && user) void saveCloudTransaction(item).catch((error) => setSyncError(errorMessage(error, 'Transaction saved locally but cloud sync failed.'))); }
  function deleteTransaction(id: string) { setTransactions((current) => current.filter((item) => item.id !== id)); if (cloudReady && user) void deleteCloudTransaction(id).catch((error) => setSyncError(errorMessage(error, 'Transaction delete failed to sync.'))); }
  function createInvoice(draft: InvoiceDraft) { const item = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; setInvoices((current) => [item, ...current]); if (cloudReady && user) void saveCloudInvoice(item).catch((error) => setSyncError(errorMessage(error, 'Invoice saved locally but cloud sync failed.'))); }
  function updateInvoice(id: string, updates: Partial<InvoiceDraft>) { const found = invoices.find((item) => item.id === id); if (!found) return; const item = { ...found, ...updates }; setInvoices((current) => current.map((invoice) => invoice.id === id ? item : invoice)); if (cloudReady && user) void saveCloudInvoice(item).catch((error) => setSyncError(errorMessage(error, 'Invoice update failed to sync.'))); }
  function deleteInvoice(id: string) { setInvoices((current) => current.filter((item) => item.id !== id)); if (cloudReady && user) void deleteCloudInvoice(id).catch((error) => setSyncError(errorMessage(error, 'Invoice delete failed to sync.'))); }
  return { transactions, invoices, createTransaction, deleteTransaction, createInvoice, updateInvoice, deleteInvoice, syncError, syncing, syncFromCloud };
}
