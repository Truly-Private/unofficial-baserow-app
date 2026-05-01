import { ApiClient } from "./client";
import { Endpoints } from "./endpoints";

// Lightweight database and table access helpers
export async function fetchDatabases(client: ApiClient) {
  return client.get(Endpoints.databases.list());
}

export async function fetchDatabaseTables(client: ApiClient, dbId: string) {
  return client.get(Endpoints.tables.list(dbId));
}

export async function fetchTableRows(
  client: ApiClient,
  dbId: string,
  tableId: string,
) {
  // Rows endpoint is table-scoped
  const path = Endpoints.rows.list(tableId);
  // If the API requires dbId for paths, adapt here. Current Endpoints use tableId only.
  return client.get(path);
}

export async function fetchTableViews(
  client: ApiClient,
  dbId: string,
  tableId: string,
) {
  return client.get(Endpoints.views.list(dbId, tableId));
}

// Phase 2 CRUD helpers (server-backed endpoints)
export async function createDatabase(
  client: ApiClient,
  payload: { name: string },
) {
  return client.post(Endpoints.databases.list(), payload);
}

export async function updateDatabase(
  client: ApiClient,
  dbId: string,
  payload: { name?: string },
) {
  return client.put(Endpoints.databases.detail(dbId), payload);
}

export async function deleteDatabase(client: ApiClient, dbId: string) {
  return client.delete(Endpoints.databases.detail(dbId));
}

export async function createTable(
  client: ApiClient,
  dbId: string,
  payload: { name: string },
) {
  return client.post(Endpoints.tables.list(dbId), payload);
}

export async function updateTable(
  client: ApiClient,
  dbId: string,
  tableId: string,
  payload: { name?: string },
) {
  return client.put(Endpoints.tables.detail(dbId, tableId), payload);
}

export async function deleteTable(
  client: ApiClient,
  dbId: string,
  tableId: string,
) {
  return client.delete(Endpoints.tables.detail(dbId, tableId));
}

export async function createRow(
  client: ApiClient,
  dbId: string,
  tableId: string,
  payload: Record<string, any>,
) {
  // Rows endpoint is table-scoped
  return client.post(Endpoints.rows.list(tableId), payload);
}

export async function updateRow(
  client: ApiClient,
  dbId: string,
  tableId: string,
  rowId: string,
  payload: Record<string, any>,
) {
  return client.put(Endpoints.rows.detail(tableId, rowId), payload);
}

export async function deleteRow(
  client: ApiClient,
  dbId: string,
  tableId: string,
  rowId: string,
) {
  return client.delete(Endpoints.rows.detail(tableId, rowId));
}

// Field (column) CRUD helpers
export async function createField(
  client: ApiClient,
  dbId: string,
  tableId: string,
  payload: { name: string; type: FieldType },
) {
  return client.post(Endpoints.fields.list(dbId, tableId), payload);
}

export async function updateField(
  client: ApiClient,
  dbId: string,
  tableId: string,
  fieldId: string,
  payload: { name?: string; type?: FieldType },
) {
  return client.put(Endpoints.fields.detail(dbId, tableId, fieldId), payload);
}

export async function deleteField(
  client: ApiClient,
  dbId: string,
  tableId: string,
  fieldId: string,
) {
  return client.delete(Endpoints.fields.detail(dbId, tableId, fieldId));
}

export async function fetchTableFields(
  client: ApiClient,
  dbId: string,
  tableId: string,
) {
  return client.get(Endpoints.fields.list(dbId, tableId));
}

// Select option CRUD helpers
// Baserow manages select options through the field PATCH endpoint.
// Providing the full select_options array replaces all options:
//   - items with an id are updated
//   - items without an id are created
//   - previously-existing items omitted from the array are deleted

export interface SelectOptionPayload {
  id?: number;
  value: string;
  color: string;
}

export async function getFieldWithOptions(
  client: ApiClient,
  fieldId: string | number,
) {
  return client.get(Endpoints.fields.fieldDetail(fieldId));
}

export async function addSelectOption(
  client: ApiClient,
  fieldId: string | number,
  option: Omit<SelectOptionPayload, "id">,
  currentOptions: SelectOptionPayload[],
) {
  const select_options = [...currentOptions, option];
  return client.patch(Endpoints.fields.fieldDetail(fieldId), {
    select_options,
  });
}

export async function updateSelectOption(
  client: ApiClient,
  fieldId: string | number,
  optionId: number,
  changes: Partial<Omit<SelectOptionPayload, "id">>,
  currentOptions: SelectOptionPayload[],
) {
  const select_options = currentOptions.map((o) =>
    o.id === optionId ? { ...o, ...changes } : o,
  );
  return client.patch(Endpoints.fields.fieldDetail(fieldId), {
    select_options,
  });
}

export async function deleteSelectOption(
  client: ApiClient,
  fieldId: string | number,
  optionId: number,
  currentOptions: SelectOptionPayload[],
) {
  const select_options = currentOptions.filter((o) => o.id !== optionId);
  return client.patch(Endpoints.fields.fieldDetail(fieldId), {
    select_options,
  });
}

// Row Comments helpers
export interface RowComment {
  id: number;
  user_id: number | null;
  first_name: string;
  table_id: number;
  row_id: number;
  message: string;
  created_on: string;
  updated_on: string;
  edited: string;
  trashed?: boolean;
}

export async function fetchRowComments(
  client: ApiClient,
  tableId: number,
  rowId: number,
) {
  return client.get(Endpoints.rowComments.list(tableId, rowId));
}

export async function createRowComment(
  client: ApiClient,
  tableId: number,
  rowId: number,
  message: string,
) {
  return client.post(Endpoints.rowComments.create(tableId, rowId), { message });
}

export async function updateRowComment(
  client: ApiClient,
  tableId: number,
  commentId: number,
  message: string,
) {
  return client.patch(Endpoints.rowComments.update(tableId, commentId), { message });
}

export async function deleteRowComment(
  client: ApiClient,
  tableId: number,
  commentId: number,
) {
  return client.delete(Endpoints.rowComments.delete(tableId, commentId));
}

export async function setRowCommentNotificationMode(
  client: ApiClient,
  tableId: number,
  rowId: number,
  mode: "all" | "mentions",
) {
  return client.put(
    Endpoints.rowComments.notificationMode(tableId, rowId),
    { mode },
  );
}

// Notifications helpers
export interface NotificationRecipient {
  id: number;
  type: string;
  sender: { id: number; username: string; first_name?: string };
  workspace: string;
  created_on: string;
  read: boolean;
  data: any;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationRecipient[];
}

export async function fetchNotifications(
  client: ApiClient,
  workspaceId: number,
) {
  return client.get(Endpoints.notifications.list(workspaceId));
}

export async function markNotificationRead(
  client: ApiClient,
  workspaceId: number,
  notificationId: number,
) {
  return client.patch(
    Endpoints.notifications.markRead(workspaceId, notificationId),
    { read: true },
  );
}

export async function markAllNotificationsRead(
  client: ApiClient,
  workspaceId: number,
) {
  return client.post(Endpoints.notifications.markAllRead(workspaceId));
}

export async function deleteNotification(
  client: ApiClient,
  workspaceId: number,
  notificationId: number,
) {
  return client.delete(Endpoints.notifications.markRead(workspaceId, notificationId));
}

// Field type union for TypeScript
type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "file"
  | "link"
  | "lookup"
  | "formula"
  | "richtext"
  | "datetime"
  | "single_select"
  | "multiple_select";
