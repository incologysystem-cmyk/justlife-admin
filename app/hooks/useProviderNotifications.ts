"use client";

import { useCallback, useMemo, useState } from "react";
import type { ProviderNotification } from "@/lib/providerNotifications.client";
import {
  fetchProviderNotifications,
  markAllProviderNotificationsRead,
  markProviderNotificationRead,
} from "@/lib/providerNotifications.client";

export function useProviderNotifications() {
  const [items, setItems] = useState<ProviderNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.readAt).length,
    [items]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProviderNotifications({ limit: 20 });
      setItems(data.items);
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProviderNotifications({
        limit: 20,
        cursor: nextCursor,
      });
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setError(e?.message || "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [nextCursor]);

  const markOneRead = useCallback(async (id: string) => {
    // optimistic update
    setItems((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n
      )
    );
    try {
      await markProviderNotificationRead(id);
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // optimistic update
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
    );
    try {
      await markAllProviderNotificationsRead();
    } catch {
      // ignore
    }
  }, []);

  return {
    items,
    unreadCount,
    nextCursor,
    loading,
    error,
    refresh,
    loadMore,
    markOneRead,
    markAllRead,
    setItems, // optional if needed
  };
}
