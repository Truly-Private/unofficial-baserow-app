/**
 * Baserow Admin API — 28 paths covering:
 * User management, workspace management, audit log, data scanner, auth providers.
 * Requires Baserow instance admin/superuser privileges.
 */

import { authHeader } from "./baserow";
import { request } from "./baserow";
import type { BaserowCredentials } from "./baserow";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BaserowAdminUser = {
  id: number;
  username: string;
  name: string;
  email?: string;
  workspaces: BaserowAdminUserWorkspace[];
  last_login: string | null;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
};

export type BaserowAdminUserWorkspace = {
  id: number;
  name: string;
  permissions: string;
};

export type BaserowAdminUserCreate = {
  username: string;
  name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  password: string;
};

export type BaserowAdminUserUpdate = {
  username?: string;
  name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  password?: string;
};

export type BaserowAdminWorkspace = {
  id: number;
  name: string;
  users: BaserowAdminWorkspaceUser[];
  application_count: number;
  row_count: number;
  storage_usage: number;
  seats_taken: number;
  free_users: number;
  created_on: string;
};

export type BaserowAdminWorkspaceUser = {
  id: number;
  email: string;
  permissions: string;
};

export type BaserowAdminWorkspaceOption = {
  id: number;
  value: string;
};

export type BaserowAuditLog = {
  id: number;
  action_type: string;
  user: { id: number; username: string; email: string } | null;
  workspace: { id: number; name: string } | null;
  type: string;
  description: string;
  timestamp: string;
  ip_address: string;
};

export type BaserowAuditLogActionType = {
  id: string;
  value: string;
};

export type BaserowAuditLogExportJob = {
  id: number;
  type: string;
  progress_percentage: number;
  state: string;
  human_readable_error: string | null;
  created_on: string;
  updated_on: string;
  csv_column_separator: string;
  csv_first_row_header: boolean;
  export_charset: string;
  filter_user_id?: number;
  filter_workspace_id?: number;
  filter_action_type?: string;
  filter_from_timestamp?: string;
  filter_to_timestamp?: string;
  exported_file_name?: string;
  url?: string;
};

export type BaserowAuditLogExportJobCreate = {
  url: string;
  type?: string;
  export_charset?: string;
  csv_column_separator?: string;
  csv_first_row_header?: boolean;
  filter_user_id?: number;
  filter_workspace_id?: number;
  filter_action_type?: string;
  filter_from_timestamp?: string;
  filter_to_timestamp?: string;
  exclude_columns?: string[];
};

export type BaserowDataScan = {
  id: number;
  name: string;
  scan_type: string;
  pattern?: string;
  frequency?: string;
  scan_all_workspaces: boolean;
  workspace_ids: number[];
  is_running: boolean;
  last_run_started_at: string | null;
  last_run_finished_at: string | null;
  last_error: string | null;
  list_items?: string[];
  results_count: number;
  source_table_id?: number;
  source_field_id?: number;
};

export type BaserowDataScanCreate = {
  name: string;
  scan_type: string;
  pattern?: string;
  frequency?: string;
  scan_all_workspaces?: boolean;
  workspace_ids?: number[];
  list_items?: string[];
  source_table_id?: number;
  source_field_id?: number;
  whole_words?: boolean;
};

export type BaserowDataScanUpdate = {
  name?: string;
  scan_type?: string;
  pattern?: string;
  frequency?: string;
  scan_all_workspaces?: boolean;
  workspace_ids?: number[];
  list_items?: string[];
  source_table_id?: number;
  source_field_id?: number;
  whole_words?: boolean;
};

export type BaserowDataScanResult = {
  id: number;
  scan_id: number;
  scan_name: string;
  workspace_name: string;
  database_id: number;
  database_name: string;
  table_id: number;
  table_name: string;
  field_name: string;
  row_id: number;
  matched_value: string;
  first_identified_on: string;
  last_identified_on: string;
};

export type BaserowDataScanResultExportJob = {
  id: number;
  type: string;
  progress_percentage: number;
  state: string;
  human_readable_error: string | null;
  created_on: string;
  updated_on: string;
  csv_column_separator: string;
  csv_first_row_header: boolean;
  export_charset: string;
  filter_scan_id?: number;
  exported_file_name?: string;
  url?: string;
};

export type BaserowDataScanResultExportJobCreate = {
  url: string;
  export_charset?: string;
  csv_column_separator?: string;
  csv_first_row_header?: boolean;
  filter_scan_id?: number;
};

export type BaserowAuthProviderBase = {
  type: string;
  id?: number;
  domain?: string;
  enabled?: boolean;
};

export type BaserowAuthProviderPassword = BaserowAuthProviderBase & {
  type: "password";
};

export type BaserowAuthProviderGoogle = BaserowAuthProviderBase & {
  type: "google";
  name: string;
  client_id: string;
  secret: string;
};

export type BaserowAuthProviderGithub = BaserowAuthProviderBase & {
  type: "github";
  name: string;
  client_id: string;
  secret: string;
};

export type BaserowAuthProviderGitlab = BaserowAuthProviderBase & {
  type: "gitlab";
  name: string;
  base_url: string;
  client_id: string;
  secret: string;
};

export type BaserowAuthProviderOpenIdConnect = BaserowAuthProviderBase & {
  type: "openidconnect";
  name: string;
  base_url: string;
  client_id: string;
  secret: string;
  use_id_token?: boolean;
  email_attr_key?: string;
  first_name_attr_key?: string;
  last_name_attr_key?: string;
};

export type BaserowAuthProviderSaml = BaserowAuthProviderBase & {
  type: "saml";
  name: string;
  metadata: string;
  is_verified?: boolean;
  email_attr_key?: string;
  first_name_attr_key?: string;
  last_name_attr_key?: string;
};

export type BaserowAuthProvider =
  | BaserowAuthProviderPassword
  | BaserowAuthProviderGoogle
  | BaserowAuthProviderGithub
  | BaserowAuthProviderGitlab
  | BaserowAuthProviderOpenIdConnect
  | BaserowAuthProviderSaml;

export type BaserowAdminDashboard = {
  total_users: number;
  total_workspaces: number;
  total_applications: number;
  new_users_last_24_hours: number;
  new_users_last_7_days: number;
  new_users_last_30_days: number;
  previous_new_users_last_24_hours: number;
  previous_new_users_last_7_days: number;
  previous_new_users_last_30_days: number;
  active_users_last_24_hours: number;
  active_users_last_7_days: number;
  active_users_last_30_days: number;
  previous_active_users_last_24_hours: number;
  previous_active_users_last_7_days: number;
  previous_active_users_last_30_days: number;
};

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

/**
 * Get admin dashboard stats (total users, workspaces, applications, growth metrics).
 */
export async function getAdminDashboard(
  creds: BaserowCredentials,
): Promise<BaserowAdminDashboard> {
  return request(creds.baseUrl, "/api/admin/dashboard/", {
    headers: authHeader(creds),
  });
}

// ─── Admin Users ─────────────────────────────────────────────────────────────

/**
 * List all users on the instance (admin only).
 */
export async function listAdminUsers(
  creds: BaserowCredentials,
  params?: { page?: number; page_size?: number; search?: string },
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowAdminUser[] }> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();
  return request(creds.baseUrl, `/api/admin/users/?${query}`, {
    headers: authHeader(creds),
  });
}

/**
 * Create a new user on the instance (admin only).
 */
export async function createAdminUser(
  creds: BaserowCredentials,
  payload: BaserowAdminUserCreate,
): Promise<BaserowAdminUser> {
  return request(creds.baseUrl, "/api/admin/users/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing user (admin only).
 */
export async function updateAdminUser(
  creds: BaserowCredentials,
  userId: number,
  payload: BaserowAdminUserUpdate,
): Promise<BaserowAdminUser> {
  return request(creds.baseUrl, `/api/admin/users/${userId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a user from the instance (admin only).
 */
export async function deleteAdminUser(
  creds: BaserowCredentials,
  userId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/admin/users/${userId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Impersonate a user — obtain a JWT for that user (admin only).
 */
export async function impersonateAdminUser(
  creds: BaserowCredentials,
  userId: number,
): Promise<{ access: string; refresh_token: string; token: string }> {
  return request(creds.baseUrl, "/api/admin/users/impersonate/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify({ user_id: userId }),
  });
}

// ─── Admin Workspaces ────────────────────────────────────────────────────────

/**
 * List all workspaces on the instance (admin only).
 */
export async function listAdminWorkspaces(
  creds: BaserowCredentials,
  params?: { page?: number; page_size?: number; search?: string },
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowAdminWorkspace[] }> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();
  return request(creds.baseUrl, `/api/admin/workspaces/?${query}`, {
    headers: authHeader(creds),
  });
}

/**
 * Delete a workspace from the instance (admin only).
 */
export async function deleteAdminWorkspace(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/admin/workspaces/${workspaceId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Get workspace options for filtering/dropdowns (admin only).
 */
export async function listAdminWorkspaceOptions(
  creds: BaserowCredentials,
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowAdminWorkspaceOption[] }> {
  return request(creds.baseUrl, "/api/admin/workspaces/options/", {
    headers: authHeader(creds),
  });
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

/**
 * List audit log entries (admin only).
 */
export async function listAuditLog(
  creds: BaserowCredentials,
  params?: {
    page?: number;
    page_size?: number;
    user_id?: number;
    workspace_id?: number;
    action_type?: string;
    from_timestamp?: string;
    to_timestamp?: string;
  },
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowAuditLog[] }> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  if (params?.user_id != null) qs.set("user_id", String(params.user_id));
  if (params?.workspace_id != null) qs.set("workspace_id", String(params.workspace_id));
  if (params?.action_type) qs.set("action_type", params.action_type);
  if (params?.from_timestamp) qs.set("from_timestamp", params.from_timestamp);
  if (params?.to_timestamp) qs.set("to_timestamp", params.to_timestamp);
  const query = qs.toString();
  return request(creds.baseUrl, `/api/admin/audit-log/?${query}`, {
    headers: authHeader(creds),
  });
}

/**
 * Get available audit log action types for filtering.
 */
export async function listAuditLogActionTypes(
  creds: BaserowCredentials,
): Promise<BaserowAuditLogActionType[]> {
  const data = await request<{ results: BaserowAuditLogActionType[] }>(
    creds.baseUrl,
    "/api/admin/audit-log/action-types/",
    { headers: authHeader(creds) },
  );
  return data.results;
}

/**
 * Get audit log entries for a specific user.
 */
export async function listAuditLogByUser(
  creds: BaserowCredentials,
  userId: number,
  params?: { page?: number; page_size?: number },
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowAuditLog[] }> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return request(creds.baseUrl, `/api/admin/audit-log/users/${userId}/?${query}`, {
    headers: authHeader(creds),
  });
}

/**
 * Export audit log — returns a job that produces a downloadable CSV.
 */
export async function exportAuditLog(
  creds: BaserowCredentials,
  payload: BaserowAuditLogExportJobCreate,
): Promise<BaserowAuditLogExportJob> {
  return request(creds.baseUrl, "/api/admin/audit-log/export/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

// ─── Data Scanner ───────────────────────────────────────────────────────────

/**
 * List all data scans (admin only).
 */
export async function listDataScans(
  creds: BaserowCredentials,
  params?: { page?: number; page_size?: number },
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowDataScan[] }> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return request(creds.baseUrl, `/api/admin/data-scanner/scans/?${query}`, {
    headers: authHeader(creds),
  });
}

/**
 * Get a specific data scan by ID.
 */
export async function getDataScan(
  creds: BaserowCredentials,
  scanId: number,
): Promise<BaserowDataScan> {
  return request(creds.baseUrl, `/api/admin/data-scanner/scans/${scanId}/`, {
    headers: authHeader(creds),
  });
}

/**
 * Create a new data scan (admin only).
 */
export async function createDataScan(
  creds: BaserowCredentials,
  payload: BaserowDataScanCreate,
): Promise<BaserowDataScan> {
  return request(creds.baseUrl, "/api/admin/data-scanner/scans/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing data scan (admin only).
 */
export async function updateDataScan(
  creds: BaserowCredentials,
  scanId: number,
  payload: BaserowDataScanUpdate,
): Promise<BaserowDataScan> {
  return request(creds.baseUrl, `/api/admin/data-scanner/scans/${scanId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a data scan (admin only).
 */
export async function deleteDataScan(
  creds: BaserowCredentials,
  scanId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/admin/data-scanner/scans/${scanId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Trigger a data scan to run now (admin only).
 */
export async function triggerDataScan(
  creds: BaserowCredentials,
  scanId: number,
): Promise<BaserowDataScan> {
  return request(creds.baseUrl, `/api/admin/data-scanner/scans/${scanId}/trigger/`, {
    method: "POST",
    headers: authHeader(creds),
  });
}

/**
 * List data scan results (admin only).
 */
export async function listDataScanResults(
  creds: BaserowCredentials,
  params?: { page?: number; page_size?: number; scan_id?: number },
): Promise<{ count: number; next: string | null; previous: string | null; results: BaserowDataScanResult[] }> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.page_size != null) qs.set("page_size", String(params.page_size));
  if (params?.scan_id != null) qs.set("scan_id", String(params.scan_id));
  const query = qs.toString();
  return request(creds.baseUrl, `/api/admin/data-scanner/results/?${query}`, {
    headers: authHeader(creds),
  });
}

/**
 * Delete a specific data scan result.
 */
export async function deleteDataScanResult(
  creds: BaserowCredentials,
  resultId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/admin/data-scanner/results/${resultId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Export data scan results — returns a job that produces a downloadable CSV.
 */
export async function exportDataScanResults(
  creds: BaserowCredentials,
  payload: BaserowDataScanResultExportJobCreate,
): Promise<BaserowDataScanResultExportJob> {
  return request(creds.baseUrl, "/api/admin/data-scanner/results/export/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Get workspace structure for data scanner configuration.
 */
export async function getDataScannerWorkspaceStructure(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<unknown> {
  return request(creds.baseUrl, `/api/admin/data-scanner/workspace-structure/${workspaceId}/`, {
    headers: authHeader(creds),
  });
}

// ─── Auth Providers ──────────────────────────────────────────────────────────

/**
 * List all configured authentication providers (admin only).
 */
export async function listAuthProviders(
  creds: BaserowCredentials,
): Promise<BaserowAuthProvider[]> {
  const data = await request<{ results: BaserowAuthProvider[] }>(
    creds.baseUrl,
    "/api/admin/auth-provider/",
    { headers: authHeader(creds) },
  );
  return data.results;
}

/**
 * Create a new authentication provider (admin only).
 */
export async function createAuthProvider(
  creds: BaserowCredentials,
  payload: BaserowAuthProvider,
): Promise<BaserowAuthProvider> {
  return request(creds.baseUrl, "/api/admin/auth-provider/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Get a specific auth provider by ID.
 */
export async function getAuthProvider(
  creds: BaserowCredentials,
  providerId: number,
): Promise<BaserowAuthProvider> {
  return request(creds.baseUrl, `/api/admin/auth-provider/${providerId}/`, {
    headers: authHeader(creds),
  });
}

/**
 * Update an authentication provider (admin only).
 */
export async function updateAuthProvider(
  creds: BaserowCredentials,
  providerId: number,
  payload: Partial<BaserowAuthProvider>,
): Promise<BaserowAuthProvider> {
  return request(creds.baseUrl, `/api/admin/auth-provider/${providerId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an authentication provider (admin only).
 */
export async function deleteAuthProvider(
  creds: BaserowCredentials,
  providerId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/admin/auth-provider/${providerId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}
