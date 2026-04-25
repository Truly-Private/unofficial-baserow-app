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
  | "datetime";
