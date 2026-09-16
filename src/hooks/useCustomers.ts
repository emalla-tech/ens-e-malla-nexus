import { useEffect, useRef, useState } from 'react';
import { deleteCloudCustomer, loadCloudCustomers, saveCloudCustomer } from '../services/syncService';
import type { Customer } from '../types';
import { useAuth } from './useAuth';
import { usePersistentState } from './usePersistentState';

type DraftCustomer = Omit<Customer, 'id'>;

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

export function useCustomers() {
  const { cloudReady, user } = useAuth();
  const [customers, setCustomers] = usePersistentState<Customer[]>('ens.customers.v1', []);
  const [syncError, setSyncError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const loadedCloudUser = useRef<string | null>(null);

  function syncFromCloud(seedCustomers = customers) {
    if (!cloudReady || !user) {
      return;
    }

    setSyncError('');
    setSyncing(true);

    loadCloudCustomers()
      .then((cloudCustomers) => {
        if (cloudCustomers.length > 0) {
          setCustomers(cloudCustomers);
          return;
        }

        void Promise.all(seedCustomers.map((customer) => saveCloudCustomer(customer)));
      })
      .catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Customer cloud sync failed.'));
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
  }, [cloudReady, customers, setCustomers, user]);

  function createCustomer(draft: DraftCustomer) {
    const customer: Customer = {
      ...draft,
      id: crypto.randomUUID(),
    };

    setCustomers((current) => [customer, ...current]);
    if (cloudReady && user) {
      setSyncError('');
      void saveCloudCustomer(customer).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Customer was saved locally but cloud sync failed.'));
      });
    }
  }

  function updateCustomer(customerId: string, updates: DraftCustomer) {
    const nextCustomer = customers.find((customer) => customer.id === customerId);
    setCustomers((current) =>
      current.map((customer) => (customer.id === customerId ? { ...customer, ...updates } : customer)),
    );

    if (nextCustomer && cloudReady && user) {
      setSyncError('');
      void saveCloudCustomer({ ...nextCustomer, ...updates }).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Customer was updated locally but cloud sync failed.'));
      });
    }
  }

  function deleteCustomer(customerId: string) {
    setCustomers((current) => current.filter((customer) => customer.id !== customerId));
    if (cloudReady && user) {
      setSyncError('');
      void deleteCloudCustomer(customerId).catch((error) => {
        setSyncError(getSyncErrorMessage(error, 'Customer was deleted locally but cloud sync failed.'));
      });
    }
  }

  return {
    customers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    syncError,
    syncing,
    syncFromCloud,
  };
}
