import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initDatabase } from './database';
import { getData, hasData } from './dataRepository';
import { syncAll } from './syncService';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AppData {
  user: any;
  deliveryTracking: any;
  store: any;
  categories: any[];
  products: any[];
  orders: { active: any[]; past: any[] };
  notifications: any[];
  stamps: any;
  vouchers: any[];
  wallet: any;
  loyaltyTransactions: any[];
  subscriptions: any[];
  promos: any[];
  customizationOptions: Record<string, any>;
}

interface DataContextValue {
  data: AppData | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  refreshData: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue>({
  data: null,
  isLoading: true,
  isSyncing: false,
  lastSyncError: null,
  refreshData: async () => {},
});

// ─── Provider Component ─────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await initDatabase();

        const dbHasData = await hasData();

        if (dbHasData) {
          const sqliteData = await getData();
          if (isMounted && sqliteData?.user) {
            setData(sqliteData);
          }
        }

        if (isMounted) setIsLoading(false);

        // Background sync from API
        if (isMounted) setIsSyncing(true);
        try {
          const result = await syncAll();
          if (result.synced.length > 0 && isMounted) {
            const freshData = await getData();
            if (freshData?.user) setData(freshData);
            setLastSyncError(null);
          }
          if (result.failed.length > 0 && isMounted) {
            setLastSyncError(`Failed: ${result.failed.join(', ')}`);
          }
        } catch (e: any) {
          if (isMounted) setLastSyncError('Offline — using cached data');
        } finally {
          if (isMounted) setIsSyncing(false);
        }
      } catch (error) {
        console.warn('[DataProvider] Init error:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    init();
    return () => { isMounted = false; };
  }, []);

  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    setLastSyncError(null);
    try {
      const result = await syncAll();
      if (result.synced.length > 0) {
        const freshData = await getData();
        if (freshData?.user) setData(freshData);
      }
      if (result.failed.length > 0) {
        setLastSyncError(`Failed: ${result.failed.join(', ')}`);
      }
    } catch (e: any) {
      setLastSyncError(e?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const value: DataContextValue = { data, isLoading, isSyncing, lastSyncError, refreshData };

  return React.createElement(DataContext.Provider, { value }, children);
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDataContext(): DataContextValue {
  return useContext(DataContext);
}
