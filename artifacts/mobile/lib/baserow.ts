export type BaserowCredentials = {
  baseUrl: string;
  jwt: string;
  refreshToken: string;
  user: BaserowUser;
};

export type BaserowUser = {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
};

export type BaserowWorkspace = {
  id: number;
  name: string;
};

export type BaserowApplication = {
  id: number;
  name: string;
  type: string;
  order: number;
  workspace?: BaserowWorkspace;
  group?: BaserowWorkspace;
  tables?: BaserowTable[];
};

export type BaserowTable = {
  id: number;
  name: string;
  order: number;
  database_id?: number;
};

export type BaserowViewType =
  | "grid"
  | "gallery"
  | "form"
  | "kanban"
  | "calendar"
  | string;

export type BaserowView = {
  id: number;
  table_id: number;
  name: string;
  order: number;
  type: BaserowViewType;
  filters_disabled?: boolean;
  public?: boolean;
};

export type BaserowViewFilter = {
  id: number;
  view: number;
  field: number;
  type: string;
  value: string;
};

export type BaserowViewSort = {
  id: number;
  view: number;
  field: number;
  order: "ASC" | "DESC" | string;
};

export type BaserowFieldType =
  | "text"
  | "long_text"
  | "url"
  | "email"
  | "phone_number"
  | "number"
  | "rating"
  | "boolean"
  | "date"
  | "last_modified"
  | "created_on"
  | "single_select"
  | "multiple_select"
  | "link_row"
  | "file"
  | "formula"
  | "count"
  | "rollup"
  | "lookup"
  | "multiple_collaborators"
  | "single_collaborator"
  | "uuid"
  | "autonumber"
  | "duration"
  | "password"
  | string;

export type BaserowSelectOption = {
  id: number;
  value: string;
  color: string;
};

export type BaserowField = {
  id: number;
  table_id: number;
  name: string;
  order: number;
  type: BaserowFieldType;
  primary: boolean;
  read_only?: boolean;
  number_decimal_places?: number;
  date_include_time?: boolean;
  date_format?: string;
  date_time_format?: string;
  date_force_timezone?: string | null;
  select_options?: BaserowSelectOption[];
  link_row_table_id?: number;
  link_row_related_field_id?: number;
};

export type BaserowLinkRowValue = {
  id: number;
  value: string;
  order?: string;
};

export type BaserowFile = {
  url?: string;
  thumbnails?: Record<string, { url: string; width: number; height: number }>;
  visible_name: string;
  name: string;
  size?: number;
  mime_type?: string;
  is_image?: boolean;
  image_width?: number | null;
  image_height?: number | null;
  uploaded_at?: string;
};

export type BaserowRow = {
  id: number;
  order: string;
  [key: string]: unknown;
};

export type BaserowRowsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BaserowRow[];
};

export type AssistantChat = {
  id: string;
  uuid: string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
};

export type AssistantMessage = {
  id: number;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
};

export type AssistantMessagesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AssistantMessage[];
};

export class BaserowApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function authHeader(creds: { jwt: string }): Record<string, string> {
  return { Authorization: `JWT ${creds.jwt}` };
}

async function parseError(res: Response): Promise<BaserowApiError> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }
  let message = `Request failed (${res.status})`;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d["detail"] === "string") message = d["detail"] as string;
    else if (typeof d["error"] === "string") message = d["error"] as string;
    else if (typeof d["non_field_errors"] === "object")
      message = JSON.stringify(d["non_field_errors"]);
  } else if (typeof data === "string" && data.trim().length > 0) {
    message = data;
  }
  return new BaserowApiError(res.status, data, message);
}

async function request<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const DEFAULT_BASEROW_URL = "https://api.baserow.io";

export type LoginResult = {
  token: string;
  refresh_token: string;
  user: BaserowUser;
};

export async function login(
  baseUrl: string,
  email: string,
  password: string,
): Promise<LoginResult> {
  return request<LoginResult>(baseUrl, "/api/user/token-auth/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAuth(
  baseUrl: string,
  refreshToken: string,
): Promise<{ token: string }> {
  return request<{ token: string }>(baseUrl, "/api/user/token-refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function listApplications(
  creds: BaserowCredentials,
): Promise<BaserowApplication[]> {
  return request<BaserowApplication[]>(creds.baseUrl, "/api/applications/", {
    headers: authHeader(creds),
  });
}

export async function listFields(
  creds: BaserowCredentials,
  tableId: number,
): Promise<BaserowField[]> {
  return request<BaserowField[]>(
    creds.baseUrl,
    `/api/database/fields/table/${tableId}/`,
    { headers: authHeader(creds) },
  );
}

export async function listViews(
  creds: BaserowCredentials,
  tableId: number,
): Promise<BaserowView[]> {
  return request<BaserowView[]>(
    creds.baseUrl,
    `/api/database/views/table/${tableId}/`,
    { headers: authHeader(creds) },
  );
}

export async function listViewFilters(
  creds: BaserowCredentials,
  viewId: number,
): Promise<BaserowViewFilter[]> {
  return request<BaserowViewFilter[]>(
    creds.baseUrl,
    `/api/database/views/${viewId}/filters/`,
    { headers: authHeader(creds) },
  );
}

export async function listViewSortings(
  creds: BaserowCredentials,
  viewId: number,
): Promise<BaserowViewSort[]> {
  return request<BaserowViewSort[]>(
    creds.baseUrl,
    `/api/database/views/${viewId}/sortings/`,
    { headers: authHeader(creds) },
  );
}

export async function listRows(
  creds: BaserowCredentials,
  tableId: number,
  opts: {
    search?: string;
    page?: number;
    size?: number;
    viewId?: number;
    orderBy?: string[];
  } = {},
): Promise<BaserowRowsResponse> {
  const params = new URLSearchParams();
  params.set("user_field_names", "true");
  params.set("size", String(opts.size ?? 100));
  params.set("page", String(opts.page ?? 1));
  if (opts.viewId) {
    params.set("view_id", String(opts.viewId));
  }
  if (opts.orderBy && opts.orderBy.length > 0) {
    params.set("order_by", opts.orderBy.join(","));
  }
  if (opts.search && opts.search.trim().length > 0) {
    params.set("search", opts.search.trim());
  }
  return request<BaserowRowsResponse>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/?${params.toString()}`,
    { headers: authHeader(creds) },
  );
}

export async function getRow(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
): Promise<BaserowRow> {
  return request<BaserowRow>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
    { headers: authHeader(creds) },
  );
}

export async function createRow(
  creds: BaserowCredentials,
  tableId: number,
  payload: Record<string, unknown>,
): Promise<BaserowRow> {
  return request<BaserowRow>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/?user_field_names=true`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(payload),
    },
  );
}

export async function updateRow(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
  payload: Record<string, unknown>,
): Promise<BaserowRow> {
  return request<BaserowRow>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteRow(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
): Promise<void> {
  await request<null>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/${rowId}/`,
    { method: "DELETE", headers: authHeader(creds) },
  );
}

export const READONLY_FIELD_TYPES = new Set<BaserowFieldType>([
  "formula",
  "count",
  "rollup",
  "lookup",
  "created_on",
  "last_modified",
  "uuid",
  "autonumber",
  "multiple_collaborators",
  "single_collaborator",
  "password",
  "duration",
]);

export async function uploadUserFile(
  creds: BaserowCredentials,
  file: { uri: string; name: string; type?: string },
): Promise<BaserowFile> {
  const url = `${creds.baseUrl.replace(/\/+$/, "")}/api/user-files/upload-file/`;
  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } objects.
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type ?? "application/octet-stream",
  } as unknown as Blob);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `JWT ${creds.jwt}`,
    },
    body: form,
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as BaserowFile;
}

export function isEditable(field: BaserowField): boolean {
  if (field.read_only) return false;
  if (READONLY_FIELD_TYPES.has(field.type)) return false;
  return true;
}

export function getPrimaryDisplay(
  row: BaserowRow,
  fields: BaserowField[],
): string {
  const primary = fields.find((f) => f.primary) ?? fields[0];
  if (!primary) return `Row ${row.id}`;
  const value = row[primary.name];
  return formatFieldDisplay(primary, value) || `Row ${row.id}`;
}

export function formatFieldDisplay(
  field: BaserowField,
  value: unknown,
): string {
  if (value === null || value === undefined || value === "") return "";
  switch (field.type) {
    case "boolean":
      return value ? "Yes" : "No";
    case "rating":
      return `${value} ★`;
    case "single_select": {
      const v = value as { value?: string } | null;
      return v?.value ?? "";
    }
    case "multiple_select": {
      const arr = (value as { value?: string }[]) ?? [];
      return arr.map((o) => o.value ?? "").join(", ");
    }
    case "single_collaborator": {
      const v = value as { name?: string; email?: string } | null;
      return v?.name ?? v?.email ?? "";
    }
    case "multiple_collaborators": {
      const arr = (value as { name?: string }[]) ?? [];
      return arr.map((o) => o.name ?? "").join(", ");
    }
    case "link_row": {
      const arr = (value as { value?: string }[]) ?? [];
      return arr.map((o) => o.value ?? "").join(", ");
    }
    case "file": {
      const arr = (value as { visible_name?: string }[]) ?? [];
      if (arr.length === 0) return "";
      return arr.length === 1
        ? arr[0]?.visible_name ?? "1 file"
        : `${arr.length} files`;
    }
    case "date":
    case "last_modified":
    case "created_on": {
      const s = String(value);
      try {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) {
          if (field.date_include_time) {
            return d.toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }
          return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      } catch {
        /* fall through */
      }
      return s;
    }
    case "number": {
      const n = Number(value);
      if (Number.isNaN(n)) return String(value);
      const dp = field.number_decimal_places ?? 0;
      return n.toLocaleString(undefined, {
        minimumFractionDigits: dp,
        maximumFractionDigits: Math.max(dp, 6),
      });
    }
    default:
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
  }
}

export function preparePayload(
  fields: BaserowField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (!isEditable(field)) continue;
    if (!(field.name in values)) continue;
    const raw = values[field.name];
    payload[field.name] = normalizeForApi(field, raw);
  }
  return payload;
}

function normalizeForApi(field: BaserowField, value: unknown): unknown {
  if (value === undefined) return null;
  switch (field.type) {
    case "number": {
      if (value === "" || value === null) return null;
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    }
    case "rating": {
      if (value === "" || value === null) return 0;
      const n = Number(value);
      return Number.isNaN(n) ? 0 : Math.max(0, Math.min(10, Math.round(n)));
    }
    case "boolean":
      return Boolean(value);
    case "single_select": {
      if (value === null || value === "" || value === undefined) return null;
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    }
    case "multiple_select": {
      if (!Array.isArray(value)) return [];
      return value
        .map((v) => {
          if (typeof v === "number") return v;
          if (v && typeof v === "object" && "id" in (v as object))
            return (v as { id: number }).id;
          const n = Number(v);
          return Number.isNaN(n) ? null : n;
        })
        .filter((n): n is number => typeof n === "number");
    }
    case "link_row": {
      if (!Array.isArray(value)) return [];
      return value
        .map((v) => {
          if (typeof v === "number") return v;
          if (v && typeof v === "object" && "id" in (v as object))
            return (v as { id: number }).id;
          const n = Number(v);
          return Number.isNaN(n) ? null : n;
        })
        .filter((n): n is number => typeof n === "number");
    }
    case "file": {
      if (!Array.isArray(value)) return [];
      return value
        .map((v) => {
          if (!v || typeof v !== "object") return null;
          const obj = v as Partial<BaserowFile>;
          if (!obj.name) return null;
          return obj.visible_name
            ? { name: obj.name, visible_name: obj.visible_name }
            : { name: obj.name };
        })
        .filter((v): v is { name: string; visible_name?: string } => v !== null);
    }
    case "date": {
      if (value === null || value === "") return null;
      return value;
    }
    default:
      if (value === "") return null;
      return value;
  }
}

/**
 * Format a JS Date into the ISO-like string Baserow expects for a date field.
 * - date only: "YYYY-MM-DD"
 * - datetime:  full ISO string ("2025-04-24T13:45:00.000Z")
 */
export function dateToBaserowString(
  date: Date,
  includeTime: boolean,
): string {
  if (!includeTime) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return date.toISOString();
}

/**
 * Parse a Baserow date/datetime string into a JS Date. Returns null if invalid.
 */
export function parseBaserowDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value);
  // Date-only "YYYY-MM-DD" — interpret as local midnight to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map((p) => Number(p));
    return new Date(y, m - 1, d);
  }
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : t;
}

// ============================================================================
// AI Assistant API
// ============================================================================

/**
 * List all AI assistant chat sessions for a workspace.
 */
export async function listAssistantChats(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<AssistantChat[]> {
  return request<AssistantChat[]>(
    creds.baseUrl,
    `/api/assistant/workspace/${workspaceId}/chats/`,
    { headers: authHeader(creds) },
  );
}

/**
 * List messages in an AI assistant chat.
 */
export async function listAssistantMessages(
  creds: BaserowCredentials,
  workspaceId: number,
  chatId: string,
  opts: { page?: number; size?: number } = {},
): Promise<AssistantMessagesResponse> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("size", String(opts.size ?? 50));
  return request<AssistantMessagesResponse>(
    creds.baseUrl,
    `/api/assistant/workspace/${workspaceId}/chat/${chatId}/messages/?${params.toString()}`,
    { headers: authHeader(creds) },
  );
}

/**
 * Send a message to the AI assistant and get a response.
 */
export async function sendAssistantMessage(
  creds: BaserowCredentials,
  workspaceId: number,
  chatId: string,
  message: string,
): Promise<AssistantMessage> {
  return request<AssistantMessage>(
    creds.baseUrl,
    `/api/assistant/workspace/${workspaceId}/chat/${chatId}/messages/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ message }),
    },
  );
}

/**
 * Cancel an ongoing AI assistant message generation.
 */
export async function cancelAssistantMessage(
  creds: BaserowCredentials,
  chatUuid: string,
): Promise<void> {
  await request<null>(
    creds.baseUrl,
    `/assistant/chat/${chatUuid}/messages/`,
    { method: "DELETE", headers: authHeader(creds) },
  );
}

/**
 * Submit feedback (thumbs up/down) for an AI assistant message.
 */
export async function submitAssistantFeedback(
  creds: BaserowCredentials,
  messageId: number,
  sentiment: "positive" | "negative",
  feedback?: string,
): Promise<void> {
  await request<null>(
    creds.baseUrl,
    `/assistant/messages/${messageId}/feedback/`,
    {
      method: "PUT",
      headers: authHeader(creds),
      body: JSON.stringify({ sentiment, feedback }),
    },
  );
}
