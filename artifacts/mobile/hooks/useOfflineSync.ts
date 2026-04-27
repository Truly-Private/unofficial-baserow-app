/**
 * Offline Sync Hook
 * 
 * Provides offline-first data persistence using AsyncStorage.
 * Queues mutations when offline and syncs when connection is restored.
 * 
 * To enable full functionality:
 * 1. npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo
 * 2. Replace stub implementations with actual code
 */

import { useCallback, useEffect, useState } from "react";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface QueuedMutation {
  id: string;
  type: "create" | "update" | "delete";
  tableId: number;
  rowId?: number;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingMutations: number;
  lastSyncedAt: string | null;
}

// Stub storage interface
interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Simple in-memory storage for stub (would be AsyncStorage in production)
const memoryStorage: Record<string, string> = {};
const storage: Storage = {
  async getItem(key: string) {
    return memoryStorage[key] ?? null;
  },
  async setItem(key: string, value: string) {
    memoryStorage[key] = value;
  },
  async removeItem(key: string) {
    delete memoryStorage[key];
  },
};

const STORAGE_KEYS = {
  QUEUE: "offline_mutations_queue",
  LAST_SYNC: "offline_last_synced",
  CACHED_ROWS: (tableId: number) => `cached_rows_${tableId}`,
};

export function useOfflineSync() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    syncStatus: "idle",
    pendingMutations: 0,
    lastSyncedAt: null,
  });

  // Monitor network connectivity (stubbed)
  useEffect(() => {
    // Would use NetInfo.addEventListener in production
    console.log("Offline sync hook loaded (stub mode)");

    // Simulate occasional online status check
    const interval = setInterval(() => {
      // In production, this would check actual connectivity
      setState((prev) => ({ ...prev, isOnline: true }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Load initial state
  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const [queueStr, lastSync] = await Promise.all([
        storage.getItem(STORAGE_KEYS.QUEUE),
        storage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      const queue: QueuedMutation[] = queueStr ? JSON.parse(queueStr) : [];

      setState((prev) => ({
        ...prev,
        pendingMutations: queue.length,
        lastSyncedAt: lastSync,
      }));
    } catch (error) {
      console.error("Failed to load offline state:", error);
    }
  };

  const queueMutation = useCallback(
    async (mutation: Omit<QueuedMutation, "id" | "timestamp">) => {
      const queuedMutation: QueuedMutation = {
        ...mutation,
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      };

      try {
        const existingStr = await storage.getItem(STORAGE_KEYS.QUEUE);
        const existing: QueuedMutation[] = existingStr ? JSON.parse(existingStr) : [];
        const updated = [...existing, queuedMutation];

        await storage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updated));

        setState((prev) => ({
          ...prev,
          pendingMutations: updated.length,
          syncStatus: "idle",
        }));

        // Try to sync immediately if online
        if (state.isOnline) {
          syncPendingMutations();
        }
      } catch (error) {
        console.error("Failed to queue mutation:", error);
        throw error;
      }
    },
    [state.isOnline]
  );

  const syncPendingMutations = useCallback(async () => {
    if (state.syncStatus === "syncing") return;

    setState((prev) => ({ ...prev, syncStatus: "syncing" }));

    try {
      const queueStr = await storage.getItem(STORAGE_KEYS.QUEUE);
      const queue: QueuedMutation[] = queueStr ? JSON.parse(queueStr) : [];

      if (queue.length === 0) {
        setState((prev) => ({ ...prev, syncStatus: "idle" }));
        return;
      }

      // Sort by timestamp to maintain order
      const sorted = queue.sort((a, b) => a.timestamp - b.timestamp);

      for (const mutation of sorted) {
        try {
          await executeMutation(mutation);
          // Remove from queue on success
          const remaining = queue.filter((m) => m.id !== mutation.id);
          await storage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(remaining));
        } catch (error) {
          console.error(`Failed to sync mutation ${mutation.id}:`, error);
          // Continue with other mutations
        }
      }

      const lastSync = new Date().toISOString();
      await storage.setItem(STORAGE_KEYS.LAST_SYNC, lastSync);

      setState((prev) => ({
        ...prev,
        syncStatus: "idle",
        pendingMutations: queue.length,
        lastSyncedAt: lastSync,
      }));
    } catch (error) {
      console.error("Sync failed:", error);
      setState((prev) => ({ ...prev, syncStatus: "error" }));
    }
  }, [state.syncStatus]);

  const clearQueue = useCallback(async () => {
    await storage.removeItem(STORAGE_KEYS.QUEUE);
    setState((prev) => ({
      ...prev,
      pendingMutations: 0,
    }));
  }, []);

  return {
    ...state,
    queueMutation,
    syncPendingMutations,
    clearQueue,
  };
}

// Cache rows for offline access
export async function cacheRows(
  tableId: number,
  rows: Record<string, unknown>[]
): Promise<void> {
  try {
    await storage.setItem(
      STORAGE_KEYS.CACHED_ROWS(tableId),
      JSON.stringify(rows)
    );
  } catch (error) {
    console.error("Failed to cache rows:", error);
  }
}

// Get cached rows
export async function getCachedRows(
  tableId: number
): Promise<Record<string, unknown>[] | null> {
  try {
    const cached = await storage.getItem(STORAGE_KEYS.CACHED_ROWS(tableId));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Failed to get cached rows:", error);
    return null;
  }
}

// Execute a single mutation (would integrate with Baserow API)
async function executeMutation(mutation: QueuedMutation): Promise<void> {
  // This would call the appropriate Baserow API endpoint in production
  console.log("Executing mutation (stub):", mutation);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
}
