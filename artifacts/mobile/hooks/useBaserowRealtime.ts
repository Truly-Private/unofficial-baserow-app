import { useEffect, useMemo, useRef } from "react";

import { type BaserowCredentials } from "@/lib/baserow";

type TableSubscription = {
  page: "table";
  tableId: number;
};

type RowSubscription = {
  page: "row";
  tableId: number;
  rowId: number;
};

type Subscription = TableSubscription | RowSubscription;

type RealtimeMessage = {
  type?: string;
  [key: string]: unknown;
};

const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000];

function toWebSocketUrl(baseUrl: string, jwt: string): string {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/core/";
  url.search = "";
  url.searchParams.set("jwt_token", jwt);
  return url.toString();
}

function buildSubscriptionPayload(subscription: Subscription) {
  if (subscription.page === "row") {
    return {
      page: "row",
      table_id: subscription.tableId,
      row_id: subscription.rowId,
    };
  }
  return {
    page: "table",
    table_id: subscription.tableId,
  };
}

export function useBaserowRealtime(
  creds: BaserowCredentials,
  subscription: Subscription | null,
  onMessage: (message: RealtimeMessage) => void,
) {
  const onMessageRef = useRef(onMessage);
  const reconnectAttempt = useRef(0);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const socketUrl = useMemo(() => {
    if (!subscription) return null;
    return toWebSocketUrl(creds.baseUrl, creds.jwt);
  }, [creds.baseUrl, creds.jwt, subscription?.page, subscription?.tableId, subscription?.rowId]);

  const subscriptionKey = useMemo(() => {
    if (!subscription) return null;
    return subscription.page === "row"
      ? `row:${subscription.tableId}:${subscription.rowId}`
      : `table:${subscription.tableId}`;
  }, [subscription?.page, subscription?.tableId, subscription?.rowId]);

  useEffect(() => {
    if (!subscription || !socketUrl) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (cancelled) return;
      clearReconnectTimer();

      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        reconnectAttempt.current = 0;
        socket?.send(JSON.stringify(buildSubscriptionPayload(subscription)));
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(String(event.data)) as RealtimeMessage;
          onMessageRef.current(parsed);
        } catch {
          // Ignore malformed frames.
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (cancelled) return;
        const delay =
          RECONNECT_DELAYS_MS[
            Math.min(reconnectAttempt.current, RECONNECT_DELAYS_MS.length - 1)
          ];
        reconnectAttempt.current += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      socket?.close();
    };
  }, [socketUrl, subscriptionKey]);
}

export const BASEROW_TABLE_EVENT_TYPES = new Set([
  "rows_created",
  "rows_updated",
  "rows_deleted",
  "field_created",
  "field_updated",
  "field_deleted",
  "view_created",
  "view_updated",
  "view_deleted",
  "view_filter_created",
  "view_filter_updated",
  "view_filter_deleted",
  "view_sort_created",
  "view_sort_updated",
  "view_sort_deleted",
  "view_field_options_updated",
]);
