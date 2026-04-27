import { useQuery } from "@tanstack/react-query";
import { useCreds } from "@/contexts/AuthContext";
import { authHeader, type BaserowCredentials } from "@/lib/baserow";

async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...authHeader({ jwt: "" }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export type BaserowWebhook = {
  id: number;
  table_id: number;
  name: string;
  url: string;
  headers?: Record<string, string>;
  events: string[];
  is_active: boolean;
  include_row_data: boolean;
  include_cerialized_row_data: boolean;
  failure_notification_email: string | null;
  created_on: string;
  last_modified: string;
};

export type BaserowWebhookLog = {
  id: number;
  webhook_id: number;
  request_url: string;
  request_method: string;
  request_headers: Record<string, string>;
  request_body: string | null;
  status_code: number | null;
  response_body: string | null;
  duration: number | null;
  triggered_on: string;
  error: string | null;
};

const WEBHOOK_EVENTS = [
  { value: "row.created", label: "Row Created" },
  { value: "row.updated", label: "Row Updated" },
  { value: "row.deleted", label: "Row Deleted" },
  { value: "rows.created", label: "Rows Created" },
  { value: "rows.updated", label: "Rows Updated" },
  { value: "rows.deleted", label: "Rows Deleted" },
];

export { WEBHOOK_EVENTS };

export function useWebhooks(tableId: number) {
  const creds = useCreds();

  const query = useQuery({
    queryKey: ["webhooks", tableId],
    queryFn: () => listWebhooks(creds, tableId),
    enabled: !!tableId,
  });

  return query;
}

export function useWebhookLogs(webhookId: number) {
  const creds = useCreds();

  const query = useQuery({
    queryKey: ["webhook-logs", webhookId],
    queryFn: () => listWebhookLogs(creds, webhookId),
    enabled: !!webhookId,
  });

  return query;
}

export async function listWebhooks(
  creds: BaserowCredentials,
  tableId: number
): Promise<BaserowWebhook[]> {
  const res = await fetch(
    `${creds.baseUrl}/api/database/webhooks/table/${tableId}/`,
    { headers: authHeader(creds) }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function createWebhook(
  creds: BaserowCredentials,
  tableId: number,
  params: {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    is_active?: boolean;
    include_row_data?: boolean;
    include_cerialized_row_data?: boolean;
    failure_notification_email?: string;
  }
): Promise<BaserowWebhook> {
  const res = await fetch(
    `${creds.baseUrl}/api/database/webhooks/table/${tableId}/`,
    {
      method: "POST",
      headers: {
        ...authHeader(creds),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function updateWebhook(
  creds: BaserowCredentials,
  webhookId: number,
  params: Partial<{
    name: string;
    url: string;
    events: string[];
    headers: Record<string, string>;
    is_active: boolean;
    include_row_data: boolean;
    include_cerialized_row_data: boolean;
    failure_notification_email: string | null;
  }>
): Promise<BaserowWebhook> {
  const res = await fetch(
    `${creds.baseUrl}/api/database/webhooks/${webhookId}/`,
    {
      method: "PATCH",
      headers: {
        ...authHeader(creds),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function deleteWebhook(
  creds: BaserowCredentials,
  webhookId: number
): Promise<void> {
  const res = await fetch(
    `${creds.baseUrl}/api/database/webhooks/${webhookId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function listWebhookLogs(
  creds: BaserowCredentials,
  webhookId: number
): Promise<BaserowWebhookLog[]> {
  const res = await fetch(
    `${creds.baseUrl}/api/database/webhook-logs/webhook/${webhookId}/`,
    { headers: authHeader(creds) }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function resendWebhook(
  creds: BaserowCredentials,
  webhookId: number
): Promise<void> {
  const res = await fetch(
    `${creds.baseUrl}/api/database/webhooks/${webhookId}/resend/`,
    {
      method: "POST",
      headers: authHeader(creds),
    }
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}
