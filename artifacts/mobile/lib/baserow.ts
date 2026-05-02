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
  language?: string;
  notification_email_frequency?: string;
  first_workspace_id?: number;
};

export type BaserowWorkspace = {
  id: number;
  name: string;
  order?: number;
};

export type BaserowApplicationType =
  | "database"
  | "dashboard"
  | "automation"
  | "builder"
  | string;

export type BaserowJobState =
  | "pending"
  | "running"
  | "finished"
  | "failed"
  | "cancelled"
  | string;

export type BaserowApplication = {
  id: number;
  name: string;
  type: BaserowApplicationType;
  order: number;
  workspace?: BaserowWorkspace;
  group?: BaserowWorkspace;
  tables?: BaserowTable[];
  pages?: BaserowBuilderPage[];
  workflows?: BaserowAutomationWorkflow[];
};

export type BaserowTemplate = {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  keywords?: string;
  workspace_id?: number | null;
  is_default?: string;
  open_application?: number | null;
};

export type BaserowTemplateCategory = {
  id: number;
  name: string;
  templates: BaserowTemplate[];
};

export type BaserowImportResource = {
  id: number;
  name: string;
  size?: number;
};

export type BaserowJob = {
  id: number;
  type: string;
  progress_percentage: number;
  state: BaserowJobState;
  human_readable_error?: string;
  created_on?: string;
  updated_on?: string;
  installed_applications?: unknown;
  workspace_id?: number;
  resource?: BaserowImportResource;
  workspace?: BaserowWorkspace;
  url?: string;
  error?: string;
  progress?: number;
  template?: BaserowTemplate;
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
  public_view_slug?: string;
  public_view_password?: string;
  slug?: string;
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

export type BaserowRowHistoryItem = {
  id: string;
  action_type: string;
  user_id: number;
  user_email: string;
  user_first_name?: string;
  timestamp: string;
  before: Record<string, any>;
  after: Record<string, any>;
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

export type BaserowWebhook = {
  id: number;
  table_id: number;
  url: string;
  name: string;
  active: boolean;
  events: string[];
  request_method: string;
  headers: Record<string, string>;
};

export type BaserowAuditLogItem = {
  id: number;
  action_type: string;
  user_id: number;
  user_email: string;
  user_first_name?: string;
  timestamp: string;
  workspace_id?: number;
  workspace_name?: string;
  application_id?: number;
  application_name?: string;
  table_id?: number;
  table_name?: string;
  row_id?: number;
  ip_address?: string;
};

export type BaserowLicense = {
  id: number;
  license_key: string;
  is_active: boolean;
  is_valid: boolean;
  last_check: string;
  seats: number;
  free_seats: number;
  valid_from: string;
  valid_until: string;
  product_code: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
};

export type BaserowCoreWebhook = {
  id: number;
  uid: string;
  url: string;
  name: string;
  active: boolean;
  events: string[];
  request_method: string;
  headers: Record<string, string>;
};

export type BaserowViewDecoration = {
  id: number;
  view_id: number;
  type: string;
  value_provider_type: string;
  value_provider_config: Record<string, any>;
  order: number;
};

export type BaserowFilterGroup = {
  id: number;
  view: number;
  filter_type: "AND" | "OR";
  filters: BaserowViewFilter[];
  filter_groups: BaserowFilterGroup[];
};

export type BaserowComment = {
  id: number;
  table_id: number;
  row_id: number;
  user_id: number;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  comment: string;
  created_on: string;
  last_modified: string;
};

export type BaserowNotificationSender = {
  id?: number;
  first_name?: string;
  username?: string;
  [key: string]: unknown;
};

export type BaserowNotification = {
  id: number;
  type: string;
  sender?: BaserowNotificationSender | null;
  workspace?: string | null;
  created_on: string;
  read?: boolean;
  data?: Record<string, unknown> | null;
};

export type BaserowNotificationsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BaserowNotification[];
};

export type BaserowDashboardWidget = {
  id: number;
  type: string;
  title?: string;
  description?: string;
  order?: number;
  row?: number;
  col?: number;
  width?: number;
  height?: number;
  data_source_id?: number;
  data_source?: BaserowDataSource;
  [key: string]: unknown;
};

export type BaserowDataSource = {
  id: number;
  name?: string;
  type: string;
  order?: number;
  service?: unknown;
  schema_property?: string;
  [key: string]: unknown;
};

export type BaserowAutomationWorkflow = {
  id: number;
  name: string;
  order?: number;
  published?: boolean;
  state?: string;
  automation_id?: number;
  [key: string]: unknown;
};

export type BaserowAutomationNode = {
  id: number;
  type: string;
  name?: string;
  order?: number;
  workflow_id?: number;
  previous_node_id?: number | null;
  [key: string]: unknown;
};

export type BaserowAutomationHistoryItem = {
  id: number;
  status?: string;
  started_on?: string;
  finished_on?: string | null;
  message?: string;
  [key: string]: unknown;
};

export type BaserowBuilderPage = {
  id: number;
  name: string;
  path?: string;
  order?: number;
  builder_id?: number;
  [key: string]: unknown;
};

export type BaserowBuilderElement = {
  id: number;
  type: string;
  name?: string;
  order?: number;
  parent_element_id?: number | null;
  [key: string]: unknown;
};

export type BaserowBuilderWorkflowAction = {
  id: number;
  type: string;
  name?: string;
  order?: number;
  [key: string]: unknown;
};

export type BaserowBuilderDomain = {
  id: number;
  domain_name?: string;
  name?: string;
  order?: number;
  published_to?: string;
  [key: string]: unknown;
};

export type BaserowApplicationIntegration = {
  id: number;
  type: string;
  name?: string;
  order?: number;
  [key: string]: unknown;
};

export type BaserowApplicationUserSource = {
  id: number;
  type: string;
  name?: string;
  order?: number;
  [key: string]: unknown;
};

export type BaserowApplicationSnapshot = {
  id: number;
  created_on?: string;
  created_by_id?: number;
  [key: string]: unknown;
};

export type Snapshot = BaserowApplicationSnapshot;

export type AssistantChat = {
  id: string;
  uuid: string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
  title?: string;
  created_on?: string;
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

export type BaserowAssistantChat = AssistantChat;
export type BaserowAssistantMessage = AssistantMessage;
export type BaserowTrashItem = TrashItem;

export class BaserowApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function authHeader(creds: { jwt: string }): Record<string, string> {
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

export async function request<T>(
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

export async function listDatabaseTables(
  creds: BaserowCredentials,
  databaseId: number,
): Promise<BaserowTable[]> {
  return request<BaserowTable[]>(
    creds.baseUrl,
    `/api/database/tables/database/${databaseId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Get data sync details.
 * GET /api/database/data-sync/{data_sync_id}/
 */
export async function getDataSync(
  creds: BaserowCredentials,
  dataSyncId: number,
): Promise<any> {
  return request(creds.baseUrl, `/api/database/data-sync/${dataSyncId}/`, {
    headers: authHeader(creds),
  });
}

/**
 * Update a data sync.
 * PATCH /api/database/data-sync/{data_sync_id}/
 */
export async function updateDataSync(
  creds: BaserowCredentials,
  dataSyncId: number,
  params: any,
): Promise<any> {
  return request(creds.baseUrl, `/api/database/data-sync/${dataSyncId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Trigger an asynchronous data sync.
 * POST /api/database/data-sync/{data_sync_id}/sync/async/
 */
export async function triggerDataSyncAsync(
  creds: BaserowCredentials,
  dataSyncId: number,
): Promise<any> {
  return request(creds.baseUrl, `/api/database/data-sync/${dataSyncId}/sync/async/`, {
    method: "POST",
    headers: authHeader(creds),
  });
}

/**
 * Get data sync periodic interval.
 * GET /api/data-sync/{data_sync_id}/periodic-interval/
 */
export async function getDataSyncInterval(
  creds: BaserowCredentials,
  dataSyncId: number,
): Promise<any> {
  return request(creds.baseUrl, `/api/data-sync/${dataSyncId}/periodic-interval/`, {
    headers: authHeader(creds),
  });
}


/**
 * Update a database table.
 * PATCH /api/database/tables/{table_id}/
 */
export async function updateTable(
  creds: BaserowCredentials,
  tableId: number,
  params: { name: string },
): Promise<BaserowTable> {
  return request<BaserowTable>(creds.baseUrl, `/api/database/tables/${tableId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a database table.
 * DELETE /api/database/tables/{table_id}/
 */
export async function deleteTable(
  creds: BaserowCredentials,
  tableId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/database/tables/${tableId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}


export type RoleAssignment = {
  id: number;
  role: string;
  scope_id: number;
  scope_type: string;
  subject_id: number;
  subject_type: string;
};

/**
 * List all role assignments for a table.
 * GET /api/database/tables/{table_id}/role-assignments/
 */
export async function listTableRoleAssignments(
  creds: BaserowCredentials,
  tableId: number,
): Promise<RoleAssignment[]> {
  return request<RoleAssignment[]>(creds.baseUrl, `/api/database/tables/${tableId}/role-assignments/`, {
    headers: authHeader(creds),
  });
}

/**
 * Create a new role assignment for a table.
 * POST /api/database/tables/{table_id}/role-assignments/
 */
export async function createTableRoleAssignment(
  creds: BaserowCredentials,
  tableId: number,
  params: { role: string; subject_id: number; subject_type: string },
): Promise<RoleAssignment> {
  return request<RoleAssignment>(creds.baseUrl, `/api/database/tables/${tableId}/role-assignments/`, {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}



export async function listWorkspaces(
  creds: BaserowCredentials,
): Promise<BaserowWorkspace[]> {
  return request<BaserowWorkspace[]>(creds.baseUrl, "/api/workspaces/", {
    headers: authHeader(creds),
  });
}

export async function createWorkspace(
  creds: BaserowCredentials,
  params: { name: string },
): Promise<BaserowWorkspace> {
  return request<BaserowWorkspace>(creds.baseUrl, "/api/workspaces/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * List global notifications for the current user.
 * GET /api/notifications/
 */
export async function listGlobalNotifications(
  creds: BaserowCredentials,
  params: { limit?: number; offset?: number } = {},
): Promise<BaserowNotificationsResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  return request<BaserowNotificationsResponse>(
    creds.baseUrl,
    `/api/notifications/?${query.toString()}`,
    { headers: authHeader(creds) }
  );
}

/**
 * Mark all global notifications as read.
 * PATCH /api/notifications/mark-all-as-read/
 */
export async function markAllGlobalNotificationsRead(
  creds: BaserowCredentials,
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/notifications/mark-all-as-read/", {
    method: "PATCH",
    headers: authHeader(creds),
  });
}

export async function listNotifications(
  creds: BaserowCredentials,
  workspaceId: number,
  params?: { limit?: number; offset?: number },
): Promise<BaserowNotificationsResponse> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return request<BaserowNotificationsResponse>(
    creds.baseUrl,
    `/api/notifications/${workspaceId}/${suffix}`,
    {
      headers: authHeader(creds),
    },
  );
}

export async function markNotificationRead(
  creds: BaserowCredentials,
  workspaceId: number,
  notificationId: number,
): Promise<BaserowNotification> {
  return request<BaserowNotification>(
    creds.baseUrl,
    `/api/notifications/${workspaceId}/${notificationId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
    },
  );
}

export async function markAllNotificationsRead(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<void> {
  await request<void>(
    creds.baseUrl,
    `/api/notifications/${workspaceId}/mark-all-as-read/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function clearWorkspaceNotifications(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/notifications/${workspaceId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function createApplication(
  creds: BaserowCredentials,
  workspaceId: number,
  params: {
    name: string;
    type: BaserowApplicationType;
    init_with_data?: boolean;
    description?: string;
  },
): Promise<BaserowApplication> {
  return request<BaserowApplication>(
    creds.baseUrl,
    `/api/applications/workspace/${workspaceId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function getApplication(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<BaserowApplication> {
  return request<BaserowApplication>(
    creds.baseUrl,
    `/api/applications/${applicationId}/`,
    { headers: authHeader(creds) },
  );
}

export async function listApplicationUserSourceUsersForApplication(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<unknown> {
  return listApplicationUserSourceUsers(creds, applicationId);
}

export async function updateApplication(
  creds: BaserowCredentials,
  applicationId: number,
  params: Partial<Pick<BaserowApplication, "name">> & Record<string, unknown>,
): Promise<BaserowApplication> {
  return request<BaserowApplication>(
    creds.baseUrl,
    `/api/applications/${applicationId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteApplication(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/applications/${applicationId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function duplicateApplicationAsync(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/applications/${applicationId}/duplicate/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function listApplicationIntegrations(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<BaserowApplicationIntegration[]> {
  return request<BaserowApplicationIntegration[]>(
    creds.baseUrl,
    `/api/application/${applicationId}/integrations/`,
    { headers: authHeader(creds) },
  );
}

export async function createApplicationIntegration(
  creds: BaserowCredentials,
  applicationId: number,
  params: Record<string, unknown>,
): Promise<BaserowApplicationIntegration> {
  return request<BaserowApplicationIntegration>(
    creds.baseUrl,
    `/api/application/${applicationId}/integrations/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function updateApplicationIntegration(
  creds: BaserowCredentials,
  integrationId: number,
  params: Record<string, unknown>,
): Promise<BaserowApplicationIntegration> {
  return request<BaserowApplicationIntegration>(
    creds.baseUrl,
    `/api/integration/${integrationId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteApplicationIntegration(
  creds: BaserowCredentials,
  integrationId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/integration/${integrationId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function moveApplicationIntegration(
  creds: BaserowCredentials,
  integrationId: number,
  params: Record<string, unknown>,
): Promise<BaserowApplicationIntegration> {
  return request<BaserowApplicationIntegration>(
    creds.baseUrl,
    `/api/integration/${integrationId}/move/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function listApplicationUserSources(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<BaserowApplicationUserSource[]> {
  return request<BaserowApplicationUserSource[]>(
    creds.baseUrl,
    `/api/application/${applicationId}/user-sources/`,
    { headers: authHeader(creds) },
  );
}

export async function createApplicationUserSource(
  creds: BaserowCredentials,
  applicationId: number,
  params: Record<string, unknown>,
): Promise<BaserowApplicationUserSource> {
  return request<BaserowApplicationUserSource>(
    creds.baseUrl,
    `/api/application/${applicationId}/user-sources/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Update a user source.
 * PATCH /api/user-source/{user_source_id}/
 */
export async function updateUserSource(
  creds: BaserowCredentials,
  userSourceId: number,
  params: any,
): Promise<any> {
  return request(creds.baseUrl, `/api/user-source/${userSourceId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a user source.
 * DELETE /api/user-source/{user_source_id}/
 */
export async function deleteUserSource(
  creds: BaserowCredentials,
  userSourceId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/user-source/${userSourceId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Move a user source.
 * PATCH /api/user-source/{user_source_id}/move/
 */
export async function moveUserSource(
  creds: BaserowCredentials,
  userSourceId: number,
  params: { before_id?: number },
): Promise<any> {
  return request(creds.baseUrl, `/api/user-source/${userSourceId}/move/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Authenticate against a user source to get a token.
 * POST /api/user-source/{user_source_id}/token-auth
 */
export async function authenticateUserSource(
  creds: BaserowCredentials,
  userSourceId: number,
  params: any,
): Promise<any> {
  return request(creds.baseUrl, `/api/user-source/${userSourceId}/token-auth`, {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}


export async function listApplicationUserSourceUsers(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/application/${applicationId}/list-user-source-users/`,
    { headers: authHeader(creds) },
  );
}

export async function listApplicationUserSourceRoles(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/application/${applicationId}/user-sources/roles/`,
    { headers: authHeader(creds) },
  );
}

export async function listApplicationSnapshots(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<BaserowApplicationSnapshot[]> {
  return request<BaserowApplicationSnapshot[]>(
    creds.baseUrl,
    `/api/snapshots/application/${applicationId}/`,
    { headers: authHeader(creds) },
  );
}

export const listSnapshots = listApplicationSnapshots;

export async function createApplicationSnapshot(
  creds: BaserowCredentials,
  applicationId: number,
  params?: { name?: string },
): Promise<BaserowApplicationSnapshot> {
  return request<BaserowApplicationSnapshot>(
    creds.baseUrl,
    `/api/snapshots/application/${applicationId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: params ? JSON.stringify(params) : undefined,
    },
  );
}

export const createSnapshot = createApplicationSnapshot;

export async function restoreSnapshot(
  creds: BaserowCredentials,
  snapshotId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/snapshots/${snapshotId}/restore/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function deleteSnapshot(
  creds: BaserowCredentials,
  snapshotId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/snapshots/${snapshotId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}


export async function createTable(
  creds: BaserowCredentials,
  databaseId: number,
  params: {
    name: string;
    data?: unknown[];
    first_row_header?: boolean;
  },
): Promise<BaserowTable> {
  return request<BaserowTable>(
    creds.baseUrl,
    `/api/database/tables/database/${databaseId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function listTemplates(
  creds: BaserowCredentials,
): Promise<BaserowTemplateCategory[]> {
  return request<BaserowTemplateCategory[]>(creds.baseUrl, "/api/templates/", {
    headers: authHeader(creds),
  });
}

export async function installTemplateAsync(
  creds: BaserowCredentials,
  workspaceId: number,
  templateId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/templates/install/${workspaceId}/${templateId}/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function uploadImportResource(
  creds: BaserowCredentials,
  workspaceId: number,
  file: { uri: string; name: string; type?: string },
): Promise<BaserowImportResource> {
  const url = `${creds.baseUrl.replace(/\/+$/, "")}/api/workspaces/${workspaceId}/import/upload-file/`;
  const form = new FormData();
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
  return (await res.json()) as BaserowImportResource;
}

export async function importApplicationsAsync(
  creds: BaserowCredentials,
  workspaceId: number,
  resourceId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/workspaces/${workspaceId}/import/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({
        type: "import_applications",
        resource_id: resourceId,
      }),
    },
  );
}

export async function getJob(
  creds: BaserowCredentials,
  jobId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(creds.baseUrl, `/api/jobs/${jobId}/`, {
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

export type FieldPermission = {
  id: number;
  field_id: number;
  role: string;
  permissions: unknown;
};

/**
 * List all permissions for a specific field.
 * GET /api/database/fields/{field_id}/permissions/
 */
export async function listFieldPermissions(
  creds: BaserowCredentials,
  fieldId: number,
): Promise<FieldPermission[]> {
  return request<FieldPermission[]>(creds.baseUrl, `/api/database/fields/${fieldId}/permissions/`, {
    headers: authHeader(creds),
  });
}


/**
 * List all rules for a specific table.
 * GET /api/database/field-rules/{table_id}/
 */
export async function listFieldRules(
  creds: BaserowCredentials,
  tableId: number,
): Promise<any[]> {
  return request<any[]>(creds.baseUrl, `/api/database/field-rules/${tableId}/`, {
    headers: authHeader(creds),
  });
}

/**
 * Create a new rule for a table.
 * POST /api/database/field-rules/{table_id}/
 */
export async function createFieldRule(
  creds: BaserowCredentials,
  tableId: number,
  params: any,
): Promise<any> {
  return request<any>(creds.baseUrl, `/api/database/field-rules/${tableId}/`, {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Update an existing rule.
 * PUT /api/database/field-rules/{table_id}/rule/{rule_id}/
 */
export async function updateFieldRule(
  creds: BaserowCredentials,
  tableId: number,
  ruleId: number,
  params: any,
): Promise<any> {
  return request<any>(creds.baseUrl, `/api/database/field-rules/${tableId}/rule/${ruleId}/`, {
    method: "PUT",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}



/**
 * Create a new field in a table.
 */
export async function createField(
  creds: BaserowCredentials,
  tableId: number,
  payload: {
    name: string;
    type: BaserowFieldType;
    primary?: boolean;
    order?: number;
    // Type-specific options
    number_decimal_places?: number;
    date_include_time?: boolean;
    date_format?: string;
    select_options?: { value: string; color: string }[];
    link_row_table_id?: number;
  },
): Promise<BaserowField> {
  return request<BaserowField>(
    creds.baseUrl,
    `/api/database/fields/table/${tableId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Update an existing field.
 */
export async function updateField(
  creds: BaserowCredentials,
  fieldId: number,
  payload: Partial<{
    name: string;
    order: number;
    number_decimal_places?: number;
    date_include_time?: boolean;
    date_format?: string;
    select_options?: { id?: number; value: string; color: string }[];
  }>,
): Promise<BaserowField> {
  return request<BaserowField>(
    creds.baseUrl,
    `/api/database/fields/${fieldId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Delete a field.
 */
export async function deleteField(
  creds: BaserowCredentials,
  fieldId: number,
): Promise<void> {
  await request<null>(
    creds.baseUrl,
    `/api/database/fields/${fieldId}/`,
    { method: "DELETE", headers: authHeader(creds) },
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

/**
 * Update a database table view.
 * PATCH /api/database/views/{view_id}/
 */
export async function updateView(
  creds: BaserowCredentials,
  viewId: number,
  params: { name?: string; filter_type?: string; filters_disabled?: boolean },
): Promise<BaserowView> {
  return request<BaserowView>(creds.baseUrl, `/api/database/views/${viewId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a database table view.
 * DELETE /api/database/views/{view_id}/
 */
export async function deleteView(
  creds: BaserowCredentials,
  viewId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/database/views/${viewId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
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

/**
 * Update a view filter.
 * PATCH /api/database/views/filter/{view_filter_id}/
 */
export async function updateViewFilter(
  creds: BaserowCredentials,
  filterId: number,
  params: { field?: number; type?: string; value?: string },
): Promise<BaserowViewFilter> {
  return request<BaserowViewFilter>(creds.baseUrl, `/api/database/views/filter/${filterId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a view filter.
 * DELETE /api/database/views/filter/{view_filter_id}/
 */
export async function deleteViewFilter(
  creds: BaserowCredentials,
  filterId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/database/views/filter/${filterId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Update a view sort.
 * PATCH /api/database/views/sort/{view_sort_id}/
 */
export async function updateViewSort(
  creds: BaserowCredentials,
  sortId: number,
  params: { field?: number; order?: string },
): Promise<BaserowViewSort> {
  return request<BaserowViewSort>(creds.baseUrl, `/api/database/views/sort/${sortId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a view sort.
 * DELETE /api/database/views/sort/{view_sort_id}/
 */
export async function deleteViewSort(
  creds: BaserowCredentials,
  sortId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/database/views/sort/${sortId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * List all groupings for a view.
 * GET /api/database/views/{view_id}/group_bys/
 */
export async function listViewGroupings(
  creds: BaserowCredentials,
  viewId: number,
): Promise<any[]> {
  return request<any[]>(creds.baseUrl, `/api/database/views/${viewId}/group_bys/`, {
    headers: authHeader(creds),
  });
}

/**
 * Create a new grouping for a view.
 * POST /api/database/views/{view_id}/group_bys/
 */
export async function createViewGrouping(
  creds: BaserowCredentials,
  viewId: number,
  params: { field: number; order?: string },
): Promise<any> {
  return request<any>(creds.baseUrl, `/api/database/views/${viewId}/group_bys/`, {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Update an existing grouping.
 * PATCH /api/database/views/group_by/{view_group_by_id}/
 */
export async function updateViewGrouping(
  creds: BaserowCredentials,
  groupingId: number,
  params: { field?: number; order?: string },
): Promise<any> {
  return request<any>(creds.baseUrl, `/api/database/views/group_by/${groupingId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a grouping.
 * DELETE /api/database/views/group_by/{view_group_by_id}/
 */
export async function deleteViewGrouping(
  creds: BaserowCredentials,
  groupingId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/database/views/group_by/${groupingId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
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

export async function uploadFileViaUrl(
  creds: BaserowCredentials,
  url: string,
): Promise<BaserowFile> {
  return request<BaserowFile>(creds.baseUrl, "/api/user-files/upload-via-url/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify({ url }),
  });
}

// ============================================================================
// Dashboard API
// ============================================================================

export async function listDashboardWidgets(
  creds: BaserowCredentials,
  dashboardId: number,
): Promise<BaserowDashboardWidget[]> {
  return request<BaserowDashboardWidget[]>(
    creds.baseUrl,
    `/api/dashboard/${dashboardId}/widgets/`,
    { headers: authHeader(creds) },
  );
}

export async function createDashboardWidget(
  creds: BaserowCredentials,
  dashboardId: number,
  params: Record<string, unknown>,
): Promise<BaserowDashboardWidget> {
  return request<BaserowDashboardWidget>(
    creds.baseUrl,
    `/api/dashboard/${dashboardId}/widgets/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function updateDashboardWidget(
  creds: BaserowCredentials,
  widgetId: number,
  params: Record<string, unknown>,
): Promise<BaserowDashboardWidget> {
  return request<BaserowDashboardWidget>(
    creds.baseUrl,
    `/api/dashboard/widgets/${widgetId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteDashboardWidget(
  creds: BaserowCredentials,
  widgetId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/dashboard/widgets/${widgetId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function listDashboardDataSources(
  creds: BaserowCredentials,
  dashboardId: number,
): Promise<BaserowDataSource[]> {
  return request<BaserowDataSource[]>(
    creds.baseUrl,
    `/api/dashboard/${dashboardId}/data-sources/`,
    { headers: authHeader(creds) },
  );
}

export async function createDashboardDataSource(
  creds: BaserowCredentials,
  dashboardId: number,
  params: Record<string, unknown>,
): Promise<BaserowDataSource> {
  return request<BaserowDataSource>(
    creds.baseUrl,
    `/api/dashboard/${dashboardId}/data-sources/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function updateDashboardDataSource(
  creds: BaserowCredentials,
  dataSourceId: number,
  params: Record<string, unknown>,
): Promise<BaserowDataSource> {
  return request<BaserowDataSource>(
    creds.baseUrl,
    `/api/dashboard/data-sources/${dataSourceId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function dispatchDashboardDataSource(
  creds: BaserowCredentials,
  dataSourceId: number,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/dashboard/data-sources/${dataSourceId}/dispatch/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

// ============================================================================
// Automation API
// ============================================================================

export async function createAutomationWorkflow(
  creds: BaserowCredentials,
  automationId: number,
  params: Record<string, unknown>,
): Promise<BaserowAutomationWorkflow> {
  return request<BaserowAutomationWorkflow>(
    creds.baseUrl,
    `/api/automation/${automationId}/workflows/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function orderAutomationWorkflows(
  creds: BaserowCredentials,
  automationId: number,
  workflowIds: number[],
): Promise<void> {
  return request<void>(
    creds.baseUrl,
    `/api/automation/${automationId}/workflows/order/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ workflow_ids: workflowIds }),
    },
  );
}

export async function getAutomationWorkflow(
  creds: BaserowCredentials,
  workflowId: number,
): Promise<BaserowAutomationWorkflow> {
  return request<BaserowAutomationWorkflow>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/`,
    { headers: authHeader(creds) },
  );
}

export async function updateAutomationWorkflow(
  creds: BaserowCredentials,
  workflowId: number,
  params: Record<string, unknown>,
): Promise<BaserowAutomationWorkflow> {
  return request<BaserowAutomationWorkflow>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteAutomationWorkflow(
  creds: BaserowCredentials,
  workflowId: number,
): Promise<void> {
  return request<void>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    },
  );
}

export async function duplicateAutomationWorkflowAsync(
  creds: BaserowCredentials,
  workflowId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/duplicate/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function getAutomationWorkflowHistory(
  creds: BaserowCredentials,
  workflowId: number,
): Promise<BaserowAutomationHistoryItem[] | { results?: BaserowAutomationHistoryItem[] }> {
  return request<BaserowAutomationHistoryItem[] | { results?: BaserowAutomationHistoryItem[] }>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/history/`,
    { headers: authHeader(creds) },
  );
}

export async function publishAutomationWorkflowAsync(
  creds: BaserowCredentials,
  workflowId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/publish/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function testAutomationWorkflow(
  creds: BaserowCredentials,
  workflowId: number,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/automation/workflows/${workflowId}/test/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function listAutomationNodes(
  creds: BaserowCredentials,
  workflowId: number,
): Promise<BaserowAutomationNode[]> {
  return request<BaserowAutomationNode[]>(
    creds.baseUrl,
    `/api/automation/workflow/${workflowId}/nodes/`,
    { headers: authHeader(creds) },
  );
}

export async function createAutomationNode(
  creds: BaserowCredentials,
  workflowId: number,
  params: Record<string, unknown>,
): Promise<BaserowAutomationNode> {
  return request<BaserowAutomationNode>(
    creds.baseUrl,
    `/api/automation/workflow/${workflowId}/nodes/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function updateAutomationNode(
  creds: BaserowCredentials,
  nodeId: number,
  params: Record<string, unknown>,
): Promise<BaserowAutomationNode> {
  return request<BaserowAutomationNode>(
    creds.baseUrl,
    `/api/automation/node/${nodeId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteAutomationNode(
  creds: BaserowCredentials,
  nodeId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/automation/node/${nodeId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function duplicateAutomationNode(
  creds: BaserowCredentials,
  nodeId: number,
): Promise<BaserowAutomationNode> {
  return request<BaserowAutomationNode>(
    creds.baseUrl,
    `/api/automation/node/${nodeId}/duplicate/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function replaceAutomationNode(
  creds: BaserowCredentials,
  nodeId: number,
  params: Record<string, unknown>,
): Promise<BaserowAutomationNode> {
  return request<BaserowAutomationNode>(
    creds.baseUrl,
    `/api/automation/node/${nodeId}/replace/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function moveAutomationNode(
  creds: BaserowCredentials,
  nodeId: number,
  params: Record<string, unknown>,
): Promise<BaserowAutomationNode> {
  return request<BaserowAutomationNode>(
    creds.baseUrl,
    `/api/automation/node/${nodeId}/move/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function simulateDispatchAutomationNode(
  creds: BaserowCredentials,
  nodeId: number,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/automation/node/${nodeId}/simulate-dispatch/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

// ============================================================================
// Application Builder API
// ============================================================================

export async function createBuilderPage(
  creds: BaserowCredentials,
  builderId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderPage> {
  return request<BaserowBuilderPage>(
    creds.baseUrl,
    `/api/builder/${builderId}/pages/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function orderBuilderPages(
  creds: BaserowCredentials,
  builderId: number,
  pageIds: number[],
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/builder/${builderId}/pages/order/`, {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify({ page_ids: pageIds }),
  });
}

export async function updateBuilderPage(
  creds: BaserowCredentials,
  pageId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderPage> {
  return request<BaserowBuilderPage>(
    creds.baseUrl,
    `/api/builder/pages/${pageId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteBuilderPage(
  creds: BaserowCredentials,
  pageId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/builder/pages/${pageId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function duplicateBuilderPageAsync(
  creds: BaserowCredentials,
  pageId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/builder/pages/${pageId}/duplicate/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function createBuilderPageElement(
  creds: BaserowCredentials,
  pageId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderElement> {
  return request<BaserowBuilderElement>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/elements/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function listBuilderPageElements(
  creds: BaserowCredentials,
  pageId: number,
): Promise<BaserowBuilderElement[]> {
  return request<BaserowBuilderElement[]>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/elements/`,
    { headers: authHeader(creds) },
  );
}

export async function updateBuilderPageElement(
  creds: BaserowCredentials,
  elementId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderElement> {
  return request<BaserowBuilderElement>(
    creds.baseUrl,
    `/api/builder/element/${elementId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteBuilderPageElement(
  creds: BaserowCredentials,
  elementId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/builder/element/${elementId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function duplicateBuilderPageElement(
  creds: BaserowCredentials,
  elementId: number,
): Promise<BaserowBuilderElement> {
  return request<BaserowBuilderElement>(
    creds.baseUrl,
    `/api/builder/element/${elementId}/duplicate/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function moveBuilderPageElement(
  creds: BaserowCredentials,
  elementId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderElement> {
  return request<BaserowBuilderElement>(
    creds.baseUrl,
    `/api/builder/element/${elementId}/move/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function createBuilderPageDataSource(
  creds: BaserowCredentials,
  pageId: number,
  params: Record<string, unknown>,
): Promise<BaserowDataSource> {
  return request<BaserowDataSource>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/data-sources/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function listBuilderPageDataSources(
  creds: BaserowCredentials,
  pageId: number,
): Promise<BaserowDataSource[]> {
  return request<BaserowDataSource[]>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/data-sources/`,
    { headers: authHeader(creds) },
  );
}

export async function updateBuilderPageDataSource(
  creds: BaserowCredentials,
  dataSourceId: number,
  params: Record<string, unknown>,
): Promise<BaserowDataSource> {
  return request<BaserowDataSource>(
    creds.baseUrl,
    `/api/builder/data-source/${dataSourceId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteBuilderPageDataSource(
  creds: BaserowCredentials,
  dataSourceId: number,
): Promise<void> {
  return request<void>(
    creds.baseUrl,
    `/api/builder/data-source/${dataSourceId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    },
  );
}

export async function moveBuilderPageDataSource(
  creds: BaserowCredentials,
  dataSourceId: number,
  params: Record<string, unknown>,
): Promise<BaserowDataSource> {
  return request<BaserowDataSource>(
    creds.baseUrl,
    `/api/builder/data-source/${dataSourceId}/move/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function getBuilderPageDataSourceRecordNames(
  creds: BaserowCredentials,
  dataSourceId: number,
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/builder/data-source/${dataSourceId}/record-names/`,
    { headers: authHeader(creds) },
  );
}

export async function dispatchBuilderPageDataSources(
  creds: BaserowCredentials,
  pageId: number,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/dispatch-data-sources/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function dispatchBuilderPageDataSource(
  creds: BaserowCredentials,
  dataSourceId: number,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/builder/data-source/${dataSourceId}/dispatch/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function listBuilderPageWorkflowActions(
  creds: BaserowCredentials,
  pageId: number,
): Promise<BaserowBuilderWorkflowAction[]> {
  return request<BaserowBuilderWorkflowAction[]>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/workflow_actions/`,
    { headers: authHeader(creds) },
  );
}

export async function createBuilderPageWorkflowAction(
  creds: BaserowCredentials,
  pageId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderWorkflowAction> {
  return request<BaserowBuilderWorkflowAction>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/workflow_actions/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function updateBuilderPageWorkflowAction(
  creds: BaserowCredentials,
  workflowActionId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderWorkflowAction> {
  return request<BaserowBuilderWorkflowAction>(
    creds.baseUrl,
    `/api/builder/workflow_action/${workflowActionId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteBuilderPageWorkflowAction(
  creds: BaserowCredentials,
  workflowActionId: number,
): Promise<void> {
  return request<void>(
    creds.baseUrl,
    `/api/builder/workflow_action/${workflowActionId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    },
  );
}

export async function dispatchBuilderPageWorkflowAction(
  creds: BaserowCredentials,
  workflowActionId: number,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  return request<unknown>(
    creds.baseUrl,
    `/api/builder/workflow_action/${workflowActionId}/dispatch/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function orderBuilderWorkflowActions(
  creds: BaserowCredentials,
  pageId: number,
  workflowActionIds: number[],
): Promise<void> {
  return request<void>(
    creds.baseUrl,
    `/api/builder/page/${pageId}/workflow_actions/order/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ workflow_action_ids: workflowActionIds }),
    },
  );
}

export async function listBuilderDomains(
  creds: BaserowCredentials,
  builderId: number,
): Promise<BaserowBuilderDomain[]> {
  return request<BaserowBuilderDomain[]>(
    creds.baseUrl,
    `/api/builder/${builderId}/domains/`,
    { headers: authHeader(creds) },
  );
}

export async function createBuilderDomain(
  creds: BaserowCredentials,
  builderId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderDomain> {
  return request<BaserowBuilderDomain>(
    creds.baseUrl,
    `/api/builder/${builderId}/domains/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function askPublicBuilderDomainExists(
  domainName: string,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/ask-public-domain-exists/?domain_name=${encodeURIComponent(domainName)}`,
  );
}

export async function orderBuilderDomains(
  creds: BaserowCredentials,
  builderId: number,
  domainIds: number[],
): Promise<void> {
  return request<void>(
    creds.baseUrl,
    `/api/builder/${builderId}/domains/order/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ domain_ids: domainIds }),
    },
  );
}

export async function updateBuilderDomain(
  creds: BaserowCredentials,
  domainId: number,
  params: Record<string, unknown>,
): Promise<BaserowBuilderDomain> {
  return request<BaserowBuilderDomain>(
    creds.baseUrl,
    `/api/builder/domains/${domainId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

export async function deleteBuilderDomain(
  creds: BaserowCredentials,
  domainId: number,
): Promise<void> {
  return request<void>(creds.baseUrl, `/api/builder/domains/${domainId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

export async function publishBuilderDomainAsync(
  creds: BaserowCredentials,
  domainId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/builder/domains/${domainId}/publish/async/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

export async function updateBuilderTheme(
  creds: BaserowCredentials,
  builderId: number,
  params: Record<string, unknown>,
): Promise<unknown> {
  return request<unknown>(creds.baseUrl, `/api/builder/${builderId}/theme/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

export async function getPublicBuilderById(
  builderId: number,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/by_id/${builderId}/`,
  );
}

export async function getPublicBuilderByName(
  domainName: string,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/by_name/${encodeURIComponent(domainName)}/`,
  );
}

export async function getBuilderCustomCss(
  creds: BaserowCredentials,
  builderId: number,
): Promise<string> {
  return request<string>(creds.baseUrl, `/api/custom_code/${builderId}/css/`, {
    headers: authHeader(creds),
  });
}

export async function getBuilderCustomJs(
  creds: BaserowCredentials,
  builderId: number,
): Promise<string> {
  return request<string>(creds.baseUrl, `/api/custom_code/${builderId}/js/`, {
    headers: authHeader(creds),
  });
}

export async function getPublicBuilderCustomCss(
  builderId: number,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<string> {
  return request<string>(baseUrl, `/api/custom_code/${builderId}/css/public/`);
}

export async function getPublicBuilderCustomJs(
  builderId: number,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<string> {
  return request<string>(baseUrl, `/api/custom_code/${builderId}/js/public/`);
}

export async function getUserDashboard(
  creds: BaserowCredentials,
): Promise<unknown> {
  return request<unknown>(creds.baseUrl, "/api/user/dashboard/", {
    headers: authHeader(creds),
  });
}

export async function getAdminDashboard(
  creds: BaserowCredentials,
): Promise<unknown> {
  return request<unknown>(creds.baseUrl, "/api/admin/dashboard/", {
    headers: authHeader(creds),
  });
}

export async function listPublishedBuilderPageDataSources(
  pageId: number,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/page/${pageId}/data_sources/`,
  );
}

export async function dispatchPublishedBuilderPageDataSources(
  pageId: number,
  params: Record<string, unknown> = {},
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/page/${pageId}/dispatch-data-sources/`,
    {
      method: "POST",
      body: JSON.stringify(params),
    },
  );
}

export async function dispatchPublishedBuilderDataSource(
  dataSourceId: number,
  params: Record<string, unknown> = {},
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/data-source/${dataSourceId}/dispatch/`,
    {
      method: "POST",
      body: JSON.stringify(params),
    },
  );
}

export async function listPublishedBuilderPageElements(
  pageId: number,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/page/${pageId}/elements/`,
  );
}

export async function listPublishedBuilderPageWorkflowActions(
  pageId: number,
  baseUrl = DEFAULT_BASEROW_URL,
): Promise<unknown> {
  return request<unknown>(
    baseUrl,
    `/api/builder/domains/published/page/${pageId}/workflow_actions/`,
  );
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
 * UI Context for AI Assistant requests.
 */
export type AssistantUIContext = {
  workspace: { id: number; name: string };
  database?: { id: number; name: string };
  table?: { id: number; name: string };
  view?: { id: number; name: string };
  timezone?: string;
};

export async function listUserSessions(
  creds: BaserowCredentials,
): Promise<any[]> {
  return request<any[]>(creds.baseUrl, "/api/user/sessions/", {
    headers: authHeader(creds),
  });
}

export async function deleteUserSession(
  creds: BaserowCredentials,
  sessionId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/user/sessions/${sessionId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * List all AI assistant chat sessions for a workspace.
 * Endpoint: GET /assistant/chat/?workspace_id={workspaceId}
 */
export async function listAssistantChats(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<AssistantChat[]> {
  const params = new URLSearchParams();
  params.set("workspace_id", String(workspaceId));
  // Use bare domain (no /api prefix) for AI endpoints
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/chat/?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `JWT ${creds.jwt}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to list chats");
  }
  const response = await res.json();
  return response.results || [];
}

/**
 * List messages in an AI assistant chat.
 */
export async function listAssistantMessages(
  creds: BaserowCredentials,
  chatUuid: string,
  opts: { page?: number; size?: number } = {},
): Promise<AssistantMessagesResponse> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("size", String(opts.size ?? 50));
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/chat/${chatUuid}/messages/?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `JWT ${creds.jwt}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to list messages");
  }
  const response = await res.json();
  if (Array.isArray(response)) {
    return {
      count: response.length,
      next: null,
      previous: null,
      results: response,
    };
  }
  return {
    count: typeof response?.count === "number" ? response.count : (response?.results?.length ?? 0),
    next: response?.next ?? null,
    previous: response?.previous ?? null,
    results: Array.isArray(response?.results) ? response.results : [],
  };
}

/**
 * Send a message to the AI assistant and get a streaming response.
 * Returns an async iterable of SSE events.
 */
export async function sendAssistantMessage(
  creds: BaserowCredentials,
  chatUuid: string,
  content: string,
  uiContext?: AssistantUIContext,
): Promise<AsyncIterable<string>> {
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/chat/${chatUuid}/messages/`;
  const body = {
    content,
    ui_context: uiContext || {
      workspace: { id: 1, name: "Workspace" },
      timezone: "UTC",
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `JWT ${creds.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to send message");
  }
  // Return the response body as an async iterable for SSE parsing
  return res.body as unknown as AsyncIterable<string>;
}

/**
 * Send a message and get the full response (non-streaming).
 * Useful for simpler use cases.
 */
export async function sendAssistantMessageSimple(
  creds: BaserowCredentials,
  chatUuid: string,
  content: string,
  uiContext?: AssistantUIContext,
): Promise<{ id: number; content: string }> {
  const stream = await sendAssistantMessage(creds, chatUuid, content, uiContext);
  const chunks: string[] = [];
  const decoder = new TextDecoder();
  const body = stream as unknown as ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string> | null;

  if (body && typeof (body as ReadableStream<Uint8Array>).getReader === "function") {
    const reader = (body as ReadableStream<Uint8Array>).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } else if (body && typeof (body as AsyncIterable<Uint8Array | string>)[Symbol.asyncIterator] === "function") {
    for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
      chunks.push(typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true }));
    }
    chunks.push(decoder.decode());
  }

  const raw = chunks.join("");
  let messageId = 0;
  const messageParts: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const event = JSON.parse(data);
      if (typeof event.id === "number") messageId = event.id;
      // Only collect content from ai/message events (not ai/reasoning or others)
      if (event.type === "ai/message" || event.type === "ai/started") {
        const text = event.content ?? event.message ?? event.text ?? event.delta ?? event.answer;
        if (typeof text === "string" && event.type === "ai/message") messageParts.push(text);
      } else if (!event.type) {
        // Legacy fallback: no type field, treat as message content
        const text = event.content ?? event.message ?? event.text ?? event.delta ?? event.answer;
        if (typeof text === "string") messageParts.push(text);
      }
    } catch {
      // Non-JSON lines: skip
    }
  }

  const parsedContent = messageParts.join("").trim();
  return { id: messageId, content: parsedContent || "Assistant response received." };
}

/**
 * Cancel an ongoing AI assistant message generation.
 */
export async function cancelAssistantMessage(
  creds: BaserowCredentials,
  chatUuid: string,
): Promise<void> {
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/chat/${chatUuid}/messages/`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `JWT ${creds.jwt}` },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to cancel message");
  }
}

/**
 * Cancel an AI assistant chat session.
 * DELETE /assistant/chat/{chat_uuid}/cancel/
 */
export async function cancelAssistantSession(
  creds: BaserowCredentials,
  chatUuid: string,
): Promise<void> {
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/chat/${chatUuid}/cancel/`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `JWT ${creds.jwt}` },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to cancel session");
  }
}

/**
 * Post to cancel an AI assistant chat session.
 * POST /assistant/chat/{chat_uuid}/cancel/
 */
export async function cancelAssistantSessionPost(
  creds: BaserowCredentials,
  chatUuid: string,
): Promise<void> {
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/chat/${chatUuid}/cancel/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `JWT ${creds.jwt}` },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to cancel session");
  }
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
  const url = `${creds.baseUrl.replace(/\/api$/, "")}/assistant/messages/${messageId}/feedback/`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `JWT ${creds.jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sentiment, feedback }),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new BaserowApiError(res.status, data, data?.detail || "Failed to submit feedback");
  }
}

/**
 * List comments for a specific row.
 * GET /api/row_comments/{table_id}/{row_id}/
 */
export async function listComments(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
  params?: { limit?: number; offset?: number },
): Promise<{ count: number; next: string | null; results: BaserowComment[] }> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<{ count: number; next: string | null; results: BaserowComment[] }>(
    creds.baseUrl,
    `/api/row_comments/${tableId}/${rowId}/${suffix}`,
    { headers: authHeader(creds) }
  );
}

/**
 * Create a new comment on a row.
 * POST /api/row_comments/{table_id}/{row_id}/
 */
export async function createComment(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
  comment: string,
): Promise<BaserowComment> {
  return request<BaserowComment>(
    creds.baseUrl,
    `/api/row_comments/${tableId}/${rowId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ comment }),
    }
  );
}

/**
 * Update an existing comment.
 * PATCH /api/row_comments/{table_id}/comment/{comment_id}/
 */
export async function updateComment(
  creds: BaserowCredentials,
  tableId: number,
  commentId: number,
  comment: string,
): Promise<BaserowComment> {
  return request<BaserowComment>(
    creds.baseUrl,
    `/api/row_comments/${tableId}/comment/${commentId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify({ comment }),
    }
  );
}

/**
 * Delete a comment.
 * DELETE /api/row_comments/{table_id}/comment/{comment_id}/
 */
export async function deleteComment(
  creds: BaserowCredentials,
  tableId: number,
  commentId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/row_comments/${tableId}/comment/${commentId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Set the notification mode for a row's comments.
 * PUT /api/row_comments/{table_id}/{row_id}/notification-mode/
 */
export async function setRowCommentNotificationMode(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
  mode: "all" | "only_mentions" | "nothing",
): Promise<void> {
  await request(creds.baseUrl, `/api/row_comments/${tableId}/${rowId}/notification-mode/`, {
    method: "PUT",
    headers: authHeader(creds),
    body: JSON.stringify({ mode }),
  });
}

/**
 * List the history of changes for a specific row.
 * GET /api/database/rows/table/{table_id}/{row_id}/history/
 */
export async function listRowHistory(
  creds: BaserowCredentials,
  tableId: number,
  rowId: number,
  params: { limit?: number; offset?: number } = {},
): Promise<{ count: number; results: BaserowRowHistoryItem[] }> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  return request<{ count: number; results: BaserowRowHistoryItem[] }>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/${rowId}/history/?${query.toString()}`,
    { headers: authHeader(creds) }
  );
}

/**
 * List the audit log for the current user's workspaces.
 * GET /api/audit-log/
 */
export async function listAuditLog(
  creds: BaserowCredentials,
  params: {
    limit?: number;
    offset?: number;
    workspace_id?: number;
    user_id?: number;
    action_type?: string;
    from_timestamp?: string;
    to_timestamp?: string;
  } = {},
): Promise<{ count: number; results: BaserowAuditLogItem[] }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) query.set(k, String(v));
  });

  return request<{ count: number; results: BaserowAuditLogItem[] }>(
    creds.baseUrl,
    `/api/audit-log/?${query.toString()}`,
    { headers: authHeader(creds) }
  );
}

/**
 * List the webhooks for a specific table.
 * GET /api/database/webhooks/table/{table_id}/
 */
export async function listTableWebhooks(
  creds: BaserowCredentials,
  tableId: number,
): Promise<BaserowWebhook[]> {
  return request<BaserowWebhook[]>(
    creds.baseUrl,
    `/api/database/webhooks/table/${tableId}/`,
    { headers: authHeader(creds) }
  );
}

/**
 * Create a new webhook for a table.
 * POST /api/database/webhooks/table/{table_id}/
 */
export async function createTableWebhook(
  creds: BaserowCredentials,
  tableId: number,
  data: Partial<BaserowWebhook>,
): Promise<BaserowWebhook> {
  return request<BaserowWebhook>(
    creds.baseUrl,
    `/api/database/webhooks/table/${tableId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update an existing webhook.
 * PATCH /api/database/webhooks/{webhook_id}/
 */
export async function updateTableWebhook(
  creds: BaserowCredentials,
  webhookId: number,
  data: Partial<BaserowWebhook>,
): Promise<BaserowWebhook> {
  return request<BaserowWebhook>(
    creds.baseUrl,
    `/api/database/webhooks/${webhookId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a webhook.
 * DELETE /api/database/webhooks/{webhook_id}/
 */
export async function deleteTableWebhook(
  creds: BaserowCredentials,
  webhookId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/database/webhooks/${webhookId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Test a webhook by sending a test call.
 * POST /api/database/webhooks/table/{table_id}/test-call/
 */
export async function testTableWebhook(
  creds: BaserowCredentials,
  tableId: number,
  webhookId: number,
): Promise<any> {
  return request(
    creds.baseUrl,
    `/api/database/webhooks/table/${tableId}/test-call/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ webhook_id: webhookId }),
    }
  );
}

/**
 * List audit log users for the current user's workspaces.
 * GET /api/audit-log/users/
 */
export async function listAuditLogUsers(
  creds: BaserowCredentials,
): Promise<{ id: number; email: string; first_name?: string }[]> {
  return request<{ id: number; email: string; first_name?: string }[]>(
    creds.baseUrl,
    "/api/audit-log/users/",
    { headers: authHeader(creds) }
  );
}

/**
 * Get a core webhook by its UID.
 * GET /api/webhooks/{webhook_uid}/
 */
export async function getCoreWebhook(
  creds: BaserowCredentials,
  webhookUid: string,
): Promise<BaserowCoreWebhook> {
  return request<BaserowCoreWebhook>(
    creds.baseUrl,
    `/api/webhooks/${webhookUid}/`,
    { headers: authHeader(creds) }
  );
}

/**
 * Update a core webhook.
 * PATCH /api/webhooks/{webhook_uid}/
 */
export async function updateCoreWebhook(
  creds: BaserowCredentials,
  webhookUid: string,
  data: Partial<BaserowCoreWebhook>,
): Promise<BaserowCoreWebhook> {
  return request<BaserowCoreWebhook>(
    creds.baseUrl,
    `/api/webhooks/${webhookUid}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a core webhook.
 * DELETE /api/webhooks/{webhook_uid}/
 */
export async function deleteCoreWebhook(
  creds: BaserowCredentials,
  webhookUid: string,
): Promise<void> {
  await request(creds.baseUrl, `/api/webhooks/${webhookUid}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * List all admin licenses.
 * GET /api/licenses/
 */
export async function listAdminLicenses(
  creds: BaserowCredentials,
): Promise<BaserowLicense[]> {
  return request<BaserowLicense[]>(creds.baseUrl, "/api/licenses/", {
    headers: authHeader(creds),
  });
}

/**
 * Register a new license.
 * POST /api/licenses/
 */
export async function registerAdminLicense(
  creds: BaserowCredentials,
  licenseKey: string,
): Promise<BaserowLicense> {
  return request<BaserowLicense>(creds.baseUrl, "/api/licenses/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify({ license_key: licenseKey }),
  });
}

/**
 * Get a specific license.
 * GET /api/licenses/{id}/
 */
export async function getAdminLicense(
  creds: BaserowCredentials,
  licenseId: number,
): Promise<BaserowLicense> {
  return request<BaserowLicense>(creds.baseUrl, `/api/licenses/${licenseId}/`, {
    headers: authHeader(creds),
  });
}

/**
 * Delete a license.
 * DELETE /api/licenses/{id}/
 */
export async function deleteAdminLicense(
  creds: BaserowCredentials,
  licenseId: number,
): Promise<void> {
  await request(creds.baseUrl, `/api/licenses/${licenseId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Get the status of a database export job.
 * GET /api/database/export/{job_id}/
 */
export async function getDatabaseExportJob(
  creds: BaserowCredentials,
  jobId: number,
): Promise<BaserowJob> {
  return request<BaserowJob>(
    creds.baseUrl,
    `/api/database/export/${jobId}/`,
    { headers: authHeader(creds) }
  );
}

/**
 * Get the field options for a specific view.
 * GET /api/database/views/{view_id}/field-options/
 */
export async function getViewFieldOptions(
  creds: BaserowCredentials,
  viewId: number,
): Promise<Record<string, any>> {
  return request<Record<string, any>>(
    creds.baseUrl,
    `/api/database/views/${viewId}/field-options/`,
    { headers: authHeader(creds) }
  );
}

/**
 * Get a specific database token.
 * GET /api/database/tokens/{token_id}/
 */
export async function getDatabaseToken(
  creds: BaserowCredentials,
  tokenId: number,
): Promise<DatabaseToken> {
  return request<DatabaseToken>(
    creds.baseUrl,
    `/api/database/tokens/${tokenId}/`,
    { headers: authHeader(creds) }
  );
}

/**
 * Get row data for editing via a form view (using a row token).
 * GET /api/database/views/form/{slug}/edit-row/{row_token}/
 */
export async function getFormViewEditRow(
  baseUrl: string,
  slug: string,
  rowToken: string,
): Promise<any> {
  return request<any>(
    baseUrl,
    `/api/database/views/form/${slug}/edit-row/${rowToken}/`
  );
}

/**
 * Submit changes to a row via a form view (using a row token).
 * PATCH /api/database/views/form/{slug}/edit-row/{row_token}/
 */
export async function updateFormViewEditRow(
  baseUrl: string,
  slug: string,
  rowToken: string,
  values: Record<string, unknown>,
): Promise<any> {
  return request<any>(
    baseUrl,
    `/api/database/views/form/${slug}/edit-row/${rowToken}/`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    }
  );
}

/**
 * Create the initial workspace for a new user.
 * POST /api/workspaces/create-initial-workspace/
 */
export async function createInitialWorkspace(
  creds: BaserowCredentials,
  name: string,
): Promise<BaserowWorkspace> {
  return request<BaserowWorkspace>(
    creds.baseUrl,
    "/api/workspaces/create-initial-workspace/",
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ name }),
    }
  );
}

/**
 * Get available SSO/auth login options.
 * GET /api/auth-provider/login-options/
 */
export async function getLoginOptions(
  baseUrl: string,
): Promise<any> {
  return request<any>(baseUrl, "/api/auth-provider/login-options/");
}

/**
 * Get the SAML login URL.
 * GET /api/sso/saml/login-url/
 */
export async function getSamlLoginUrl(
  baseUrl: string,
  email: string,
): Promise<{ url: string }> {
  return request<{ url: string }>(
    baseUrl,
    `/api/sso/saml/login-url/?email=${encodeURIComponent(email)}`
  );
}

/**
 * Create multiple rows at once.
 * POST /api/database/rows/table/{table_id}/batch/
 */
export async function createRowsBatch(
  creds: BaserowCredentials,
  tableId: number,
  items: Record<string, unknown>[],
): Promise<{ items: BaserowRow[] }> {
  return request<{ items: BaserowRow[] }>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/batch/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ items }),
    }
  );
}

/**
 * Update multiple rows at once.
 * PATCH /api/database/rows/table/{table_id}/batch/
 */
export async function updateRowsBatch(
  creds: BaserowCredentials,
  tableId: number,
  items: Array<{ id: number } & Record<string, unknown>>,
): Promise<{ items: BaserowRow[] }> {
  return request<{ items: BaserowRow[] }>(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/batch/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify({ items }),
    }
  );
}

/**
 * Delete multiple rows at once.
 * POST /api/database/rows/table/{table_id}/batch-delete/
 */
export async function deleteRowsBatch(
  creds: BaserowCredentials,
  tableId: number,
  rowIds: number[],
): Promise<void> {
  await request(
    creds.baseUrl,
    `/api/database/rows/table/${tableId}/batch-delete/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ items: rowIds }),
    }
  );
}

/**
 * List all decorations for a view.
 * GET /api/database/views/{view_id}/decorations/
 */
export async function listViewDecorations(
  creds: BaserowCredentials,
  viewId: number,
): Promise<BaserowViewDecoration[]> {
  return request<BaserowViewDecoration[]>(
    creds.baseUrl,
    `/api/database/views/${viewId}/decorations/`,
    { headers: authHeader(creds) }
  );
}

/**
 * Create a new decoration for a view.
 * POST /api/database/views/{view_id}/decorations/
 */
export async function createViewDecoration(
  creds: BaserowCredentials,
  viewId: number,
  data: Partial<BaserowViewDecoration>,
): Promise<BaserowViewDecoration> {
  return request<BaserowViewDecoration>(
    creds.baseUrl,
    `/api/database/views/${viewId}/decorations/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(data),
    }
  );
}

/**
 * Create a filter group for a view.
 * POST /api/database/views/{view_id}/filter-groups/
 */
export async function createFilterGroup(
  creds: BaserowCredentials,
  viewId: number,
  data: { filter_type: "AND" | "OR" },
): Promise<BaserowFilterGroup> {
  return request<BaserowFilterGroup>(
    creds.baseUrl,
    `/api/database/views/${viewId}/filter-groups/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(data),
    }
  );
}

/**
 * Duplicate an existing view.
 * POST /api/database/views/{view_id}/duplicate/
 */
export async function duplicateView(
  creds: BaserowCredentials,
  viewId: number,
): Promise<BaserowView> {
  return request<BaserowView>(
    creds.baseUrl,
    `/api/database/views/${viewId}/duplicate/`,
    {
      method: "POST",
      headers: authHeader(creds),
    }
  );
}

/**
 * Update field options for a specific view.
 * PATCH /api/database/views/{view_id}/field-options/
 */
export async function updateViewFieldOptions(
  creds: BaserowCredentials,
  viewId: number,
  fieldOptions: Record<string, any>,
): Promise<void> {
  await request(
    creds.baseUrl,
    `/api/database/views/${viewId}/field-options/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify({ field_options: fieldOptions }),
    }
  );
}

/**
 * Remove a subject (user/team) from a team.
 * DELETE /api/teams/{team_id}/subjects/{subject_id}/
 */
export async function removeTeamSubject(
  creds: BaserowCredentials,
  teamId: number,
  subjectId: number,
): Promise<void> {
  await request(
    creds.baseUrl,
    `/api/teams/${teamId}/subjects/${subjectId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    }
  );
}

/**
 * List all global trash items for the current user.
 * GET /api/trash/
 */
export async function listGlobalTrash(
  creds: BaserowCredentials,
): Promise<BaserowTrashItem[]> {
  return request<BaserowTrashItem[]>(
    creds.baseUrl,
    "/api/trash/",
    { headers: authHeader(creds) }
  );
}

/**
 * Rotate the public sharing slug for a view.
 * POST /api/database/views/{view_id}/rotate-slug/
 */
export async function rotateViewSlug(
  creds: BaserowCredentials,
  viewId: number,
): Promise<{ slug: string }> {
  return request<{ slug: string }>(
    creds.baseUrl,
    `/api/database/views/${viewId}/rotate-slug/`,
    {
      method: "POST",
      headers: authHeader(creds),
    }
  );
}

/**
 * Update premium settings for a public view (e.g. password).
 * PATCH /api/database/view/{slug}/premium/
 */
export async function updatePublicViewPremium(
  creds: BaserowCredentials,
  slug: string,
  data: Record<string, any>,
): Promise<void> {
  await request(
    creds.baseUrl,
    `/api/database/view/${slug}/premium/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update the periodic interval for a data sync.
 * PATCH /api/data-sync/{data_sync_id}/periodic-interval/
 */
export async function updateDataSyncInterval(
  creds: BaserowCredentials,
  dataSyncId: number,
  interval: string,
): Promise<void> {
  await request(
    creds.baseUrl,
    `/api/data-sync/${dataSyncId}/periodic-interval/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify({ interval }),
    }
  );
}

/**
 * Order views within a table.
 * POST /api/database/views/table/{table_id}/order/
 */
export async function orderViews(
  creds: BaserowCredentials,
  tableId: number,
  viewIds: number[],
): Promise<void> {
  await request(
    creds.baseUrl,
    `/api/database/views/table/${tableId}/order/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ order: viewIds }),
    }
  );
}

// ============================================================================
// ─── User / Account  (Sprint 2) ─────────────────────────────────────────────
// ============================================================================

export type WorkspaceMember = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  permissions: string;
  to_be_deleted?: boolean;
  created?: string;
};

/**
 * Register a new Baserow account.
 * POST /api/user/
 */
export async function registerUser(
  baseUrl: string,
  params: {
    name: string;
    email: string;
    password: string;
    language?: string;
    group_invitation_token?: string;
  },
): Promise<LoginResult> {
  return request<LoginResult>(baseUrl, "/api/user/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Update the authenticated user's profile.
 * PATCH /api/user/account/
 */
export async function updateUserAccount(
  creds: BaserowCredentials,
  params: {
    first_name?: string;
    language?: string;
    email_notification_frequency?: "instant" | "daily" | "weekly" | "never";
  },
): Promise<BaserowUser> {
  return request<BaserowUser>(creds.baseUrl, "/api/user/account/", {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Send a confirmation email to change the user's email address.
 * POST /api/user/send-change-email-confirmation/
 */
export async function sendChangeEmailConfirmation(
  creds: BaserowCredentials,
  params: { new_email: string; password?: string },
): Promise<void> {
  await request(creds.baseUrl, "/api/user/send-change-email-confirmation/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

// ============================================================================
// ─── Two-Factor Authentication (Sprint 5+) ──────────────────────────────────
// ============================================================================

/**
 * Get 2FA configuration status.
 * GET /api/two-factor-auth/configuration/
 */
export async function get2FAConfiguration(
  creds: BaserowCredentials,
): Promise<any> {
  return request(creds.baseUrl, "/api/two-factor-auth/configuration/", {
    headers: authHeader(creds),
  });
}

/**
 * Configure a new 2FA method.
 * POST /api/two-factor-auth/configuration/
 */
export async function configure2FA(
  creds: BaserowCredentials,
  params: { type: string; [key: string]: any },
): Promise<any> {
  return request(creds.baseUrl, "/api/two-factor-auth/configuration/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Disable 2FA.
 * POST /api/two-factor-auth/disable/
 */
export async function disable2FA(
  creds: BaserowCredentials,
  params: { password?: string },
): Promise<void> {
  await request(creds.baseUrl, "/api/two-factor-auth/disable/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Verify 2FA token.
 * POST /api/two-factor-auth/verify/
 */
export async function verify2FA(
  creds: BaserowCredentials,
  params: { token: string },
): Promise<any> {
  return request(creds.baseUrl, "/api/two-factor-auth/verify/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}


/**
 * Change the authenticated user's password.
 * POST /api/user/change-password/
 */
export async function changePassword(
  creds: BaserowCredentials,
  params: { old_password: string; new_password: string },
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/user/change-password/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Request an email address change (sends confirmation email).
 * POST /api/user/change-email/
 */
export async function requestEmailChange(
  creds: BaserowCredentials,
  params: { new_email: string; password: string },
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/user/change-email/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Send (re-send) the account verification email.
 * POST /api/user/send-verify-email/
 */
export async function sendVerificationEmail(
  creds: BaserowCredentials,
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/user/send-verify-email/", {
    method: "POST",
    headers: authHeader(creds),
  });
}

/**
 * Verify the account email using the token from the confirmation email.
 * POST /api/user/verify-email/
 */
export async function verifyEmail(
  baseUrl: string,
  token: string,
): Promise<void> {
  await request<void>(baseUrl, "/api/user/verify-email/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/**
 * Request a password-reset email to be sent.
 * POST /api/user/send-reset-password-email/
 */
export async function sendResetPasswordEmail(
  baseUrl: string,
  email: string,
): Promise<void> {
  await request<void>(baseUrl, "/api/user/send-reset-password-email/", {
    method: "POST",
    body: JSON.stringify({ email, base_url: baseUrl }),
  });
}

/**
 * Complete a password reset using the token from the reset email.
 * POST /api/user/reset-password/
 */
export async function resetPassword(
  baseUrl: string,
  token: string,
  password: string,
): Promise<void> {
  await request<void>(baseUrl, "/api/user/reset-password/", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

/**
 * Invalidate the current JWT (logout on the API side).
 * POST /api/user/token-blacklist/
 */
export async function blacklistToken(
  baseUrl: string,
  refreshToken: string,
): Promise<void> {
  await request<void>(baseUrl, "/api/user/token-blacklist/", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/**
 * Verify that a JWT token is still valid.
 * POST /api/user/token-verify/
 * Returns true if valid, false if expired/invalid.
 */
export async function verifyToken(
  baseUrl: string,
  token: string,
): Promise<boolean> {
  try {
    await request<void>(baseUrl, "/api/user/token-verify/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Schedule the authenticated user's account for deletion.
 * POST /api/user/schedule-account-deletion/
 */
export async function scheduleAccountDeletion(
  creds: BaserowCredentials,
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/user/schedule-account-deletion/", {
    method: "POST",
    headers: authHeader(creds),
  });
}

/**
 * Undo the last user action.
 * PATCH /api/user/undo/
 */
export async function undoAction(
  creds: BaserowCredentials,
  scopes?: string[],
): Promise<unknown> {
  return request<unknown>(creds.baseUrl, "/api/user/undo/", {
    method: "PATCH",
    headers: authHeader(creds),
    body: scopes ? JSON.stringify({ scopes }) : undefined,
  });
}

/**
 * Redo the last undone action.
 * PATCH /api/user/redo/
 */
export async function redoAction(
  creds: BaserowCredentials,
  scopes?: string[],
): Promise<unknown> {
  return request<unknown>(creds.baseUrl, "/api/user/redo/", {
    method: "PATCH",
    headers: authHeader(creds),
    body: scopes ? JSON.stringify({ scopes }) : undefined,
  });
}

// ============================================================================
// ─── Workspace CRUD Gaps  (Sprint 2) ────────────────────────────────────────
// ============================================================================

/**
 * Update a workspace's name.
 * PATCH /api/workspaces/{workspace_id}/
 */
export async function updateWorkspace(
  creds: BaserowCredentials,
  workspaceId: number,
  params: { name: string },
): Promise<BaserowWorkspace> {
  return request<BaserowWorkspace>(
    creds.baseUrl,
    `/api/workspaces/${workspaceId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Permanently delete a workspace.
 * DELETE /api/workspaces/{workspace_id}/
 */
export async function deleteWorkspace(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/workspaces/${workspaceId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Leave a workspace (removes the current user as a member).
 * POST /api/workspaces/{workspace_id}/leave/
 */
export async function leaveWorkspace(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/workspaces/${workspaceId}/leave/`, {
    method: "POST",
    headers: authHeader(creds),
  });
}

/**
 * Get the permission set for a workspace.
 * GET /api/workspaces/{workspace_id}/permissions/
 */
export async function getWorkspacePermissions(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<unknown[]> {
  return request<unknown[]>(
    creds.baseUrl,
    `/api/workspaces/${workspaceId}/permissions/`,
    { headers: authHeader(creds) },
  );
}

/**
 * List all members of a workspace.
 * GET /api/workspaces/users/workspace/{workspace_id}/
 */
export async function listWorkspaceMembers(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<WorkspaceMember[]> {
  return request<WorkspaceMember[]>(
    creds.baseUrl,
    `/api/workspaces/users/workspace/${workspaceId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Update a workspace member's role/permissions.
 * PATCH /api/workspaces/users/{workspace_user_id}/
 */
export async function updateWorkspaceMember(
  creds: BaserowCredentials,
  workspaceUserId: number,
  params: { permissions: string },
): Promise<WorkspaceMember> {
  return request<WorkspaceMember>(
    creds.baseUrl,
    `/api/workspaces/users/${workspaceUserId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Remove a user from a workspace.
 * DELETE /api/workspaces/users/{workspace_user_id}/
 */
export async function removeWorkspaceMember(
  creds: BaserowCredentials,
  workspaceUserId: number,
): Promise<void> {
  await request<void>(
    creds.baseUrl,
    `/api/workspaces/users/${workspaceUserId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    },
  );
}

/**
 * Reorder workspaces for the current user.
 * POST /api/workspaces/order/
 */
export async function orderWorkspaces(
  creds: BaserowCredentials,
  workspaceIds: number[],
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/workspaces/order/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify({ workspaces: workspaceIds }),
  });
}

// ============================================================================
// ─── Workspace Invitations  (Sprint 3) ──────────────────────────────────────
// ============================================================================

export type WorkspaceInvitation = {
  id: number;
  workspace: { id: number; name: string };
  email: string;
  permissions: string;
  message: string;
  created_on: string;
  invited_by: { id: number; name: string };
  email_exists: boolean;
};

/**
 * List pending invitations for a workspace.
 * GET /api/workspaces/invitations/workspace/{workspace_id}/
 */
export async function listWorkspaceInvitations(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<WorkspaceInvitation[]> {
  return request<WorkspaceInvitation[]>(
    creds.baseUrl,
    `/api/workspaces/invitations/workspace/${workspaceId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Create a new workspace invitation (sends email).
 * POST /api/workspaces/invitations/workspace/{workspace_id}/
 */
export async function createWorkspaceInvitation(
  creds: BaserowCredentials,
  workspaceId: number,
  params: { email: string; permissions: string; message?: string },
): Promise<WorkspaceInvitation> {
  return request<WorkspaceInvitation>(
    creds.baseUrl,
    `/api/workspaces/invitations/workspace/${workspaceId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Get a single invitation.
 * GET /api/workspaces/invitations/{invitation_id}/
 */
export async function getWorkspaceInvitation(
  creds: BaserowCredentials,
  invitationId: number,
): Promise<WorkspaceInvitation> {
  return request<WorkspaceInvitation>(
    creds.baseUrl,
    `/api/workspaces/invitations/${invitationId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Update an invitation (change permissions level).
 * PATCH /api/workspaces/invitations/{invitation_id}/
 */
export async function updateWorkspaceInvitation(
  creds: BaserowCredentials,
  invitationId: number,
  params: { permissions?: string },
): Promise<WorkspaceInvitation> {
  return request<WorkspaceInvitation>(
    creds.baseUrl,
    `/api/workspaces/invitations/${invitationId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Delete / revoke a pending invitation.
 * DELETE /api/workspaces/invitations/{invitation_id}/
 */
export async function deleteWorkspaceInvitation(
  creds: BaserowCredentials,
  invitationId: number,
): Promise<void> {
  await request<void>(
    creds.baseUrl,
    `/api/workspaces/invitations/${invitationId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    },
  );
}

/**
 * Get an invitation by token (public — no auth required).
 * GET /api/workspaces/invitations/token/{token}/
 */
export async function getWorkspaceInvitationByToken(
  baseUrl: string,
  token: string,
): Promise<WorkspaceInvitation> {
  return request<WorkspaceInvitation>(
    baseUrl,
    `/api/workspaces/invitations/token/${token}/`,
  );
}

/**
 * Accept a workspace invitation.
 * POST /api/workspaces/invitations/{invitation_id}/accept/
 */
export async function acceptWorkspaceInvitation(
  creds: BaserowCredentials,
  invitationId: number,
): Promise<void> {
  await request<void>(
    creds.baseUrl,
    `/api/workspaces/invitations/${invitationId}/accept/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

/**
 * Reject a workspace invitation.
 * POST /api/workspaces/invitations/{invitation_id}/reject/
 */
export async function rejectWorkspaceInvitation(
  creds: BaserowCredentials,
  invitationId: number,
): Promise<void> {
  await request<void>(
    creds.baseUrl,
    `/api/workspaces/invitations/${invitationId}/reject/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
}

// ============================================================================
// ─── Trash  (Sprint 4) ──────────────────────────────────────────────────────
// ============================================================================

export type TrashItem = {
  id: number;
  trash_item_type: "table" | "field" | "row" | "application" | "workspace" | string;
  trash_item_id: number;
  parent_trash_item_id?: number | null;
  parent_trash_item_type?: string | null;
  name: string;
  names?: string[] | null;
  trashed_at: string;
  user_who_trashed?: { id: number; name: string } | null;
  workspace_id: number;
  application_id?: number | null;
};

export type TrashResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TrashItem[];
};

/**
 * List all trashed items visible to the user (can filter by workspace).
 * GET /api/trash/
 */
export async function listTrash(
  creds: BaserowCredentials,
  params?: { workspace_id?: number; page?: number },
): Promise<TrashResponse> {
  const q = new URLSearchParams();
  if (params?.workspace_id !== undefined) q.set("workspace_id", String(params.workspace_id));
  if (params?.page !== undefined) q.set("page", String(params.page));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return request<TrashResponse>(creds.baseUrl, `/api/trash/${suffix}`, {
    headers: authHeader(creds),
  });
}

/**
 * List trashed items within a specific workspace.
 * GET /api/trash/workspace/{workspace_id}/
 */
export async function listWorkspaceTrash(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<TrashResponse> {
  return request<TrashResponse>(
    creds.baseUrl,
    `/api/trash/workspace/${workspaceId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Restore a trashed item.
 * PATCH /api/trash/restore/
 */
export async function restoreTrashItem(
  creds: BaserowCredentials,
  params: {
    trash_item_type: string;
    trash_item_id: number;
    parent_trash_item_id?: number;
    parent_trash_item_type?: string;
  },
): Promise<void> {
  await request<void>(creds.baseUrl, "/api/trash/restore/", {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Permanently delete all trashed items in a workspace.
 * DELETE /api/trash/workspace/{workspace_id}/
 */
export async function emptyWorkspaceTrash(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<void> {
  await request<void>(
    creds.baseUrl,
    `/api/trash/workspace/${workspaceId}/`,
    {
      method: "DELETE",
      headers: authHeader(creds),
    },
  );
}

// ============================================================================
// ─── Role Assignments  (Sprint 3) ───────────────────────────────────────────
// ============================================================================

export type RoleAssignmentDetailed = {
  id?: number;
  subject: { id: number; type: string };
  role: string;
  scope: { id: number; type: string };
};

/**
 * List role assignments within a workspace.
 * GET /api/role/{workspace_id}/
 */
export async function listRoleAssignments(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<RoleAssignmentDetailed[]> {
  return request<RoleAssignmentDetailed[]>(
    creds.baseUrl,
    `/api/role/${workspaceId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Create or update a single role assignment.
 * POST /api/role/{workspace_id}/
 */
export async function assignRole(
  creds: BaserowCredentials,
  workspaceId: number,
  params: {
    subject_id: number;
    subject_type: string;
    role: string;
    scope_id: number;
    scope_type: string;
  },
): Promise<RoleAssignmentDetailed> {
  return request<RoleAssignmentDetailed>(
    creds.baseUrl,
    `/api/role/${workspaceId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Batch-assign multiple roles at once.
 * POST /api/role/{workspace_id}/batch/
 */
export async function batchAssignRoles(
  creds: BaserowCredentials,
  workspaceId: number,
  items: Array<{
    subject_id: number;
    subject_type: string;
    role: string;
    scope_id: number;
    scope_type: string;
  }>,
): Promise<RoleAssignmentDetailed[]> {
  return request<RoleAssignmentDetailed[]>(
    creds.baseUrl,
    `/api/role/${workspaceId}/batch/`,
    {
      method: "POST",
      headers: authHeader(creds),
      body: JSON.stringify({ items }),
    },
  );
}

// ============================================================================
// ─── Field Permissions  (Sprint 5) ──────────────────────────────────────────
// ============================================================================

export type FieldPermissionDetailed = {
  field_id: number;
  role: string;
  permission: "ALLOW" | "DENY";
  read_permission_type?: "everyone" | "admins" | "members";
  write_permission_type?: "everyone" | "admins" | "members";
  read_allowed_roles?: string[];
  write_allowed_roles?: string[];
};

/**
 * Get permissions configured for a field.
 * GET /api/field-permissions/{field_id}/
 */
export async function getFieldPermissions(
  creds: BaserowCredentials,
  fieldId: number,
): Promise<FieldPermissionDetailed> {
  return request<FieldPermissionDetailed>(
    creds.baseUrl,
    `/api/field-permissions/${fieldId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Update permissions for a field.
 * PATCH /api/field-permissions/{field_id}/
 */
export async function updateFieldPermissions(
  creds: BaserowCredentials,
  fieldId: number,
  permissions: FieldPermission[] | Partial<FieldPermissionDetailed>,
): Promise<FieldPermissionDetailed> {
  return request<FieldPermissionDetailed>(
    creds.baseUrl,
    `/api/field-permissions/${fieldId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(
        Array.isArray(permissions) ? { permissions } : permissions,
      ),
    },
  );
}

// ============================================================================
// ─── MCP Endpoints  (Sprint 5) ──────────────────────────────────────────────
// ============================================================================

export type McpEndpoint = {
  id: number;
  name: string;
  workspace_id: number;
  token: string;
  created: string;
  updated: string;
};

/**
 * List all MCP endpoints.
 * GET /api/mcp/endpoints/
 */
export async function listMcpEndpoints(
  creds: BaserowCredentials,
): Promise<McpEndpoint[]> {
  return request<McpEndpoint[]>(creds.baseUrl, "/api/mcp/endpoints/", {
    headers: authHeader(creds),
  });
}

/**
 * Create a new MCP endpoint.
 * POST /api/mcp/endpoints/
 */
export async function createMcpEndpoint(
  creds: BaserowCredentials,
  params: { name: string; workspace_id: number },
): Promise<McpEndpoint> {
  return request<McpEndpoint>(creds.baseUrl, "/api/mcp/endpoints/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Get a single MCP endpoint.
 * GET /api/mcp/endpoint/{endpoint_id}/
 */
export async function getMcpEndpoint(
  creds: BaserowCredentials,
  endpointId: number,
): Promise<McpEndpoint> {
  return request<McpEndpoint>(
    creds.baseUrl,
    `/api/mcp/endpoint/${endpointId}/`,
    { headers: authHeader(creds) },
  );
}

/**
 * Update an MCP endpoint's name.
 * PATCH /api/mcp/endpoint/{endpoint_id}/
 */
export async function updateMcpEndpoint(
  creds: BaserowCredentials,
  endpointId: number,
  params: { name?: string },
): Promise<McpEndpoint> {
  return request<McpEndpoint>(
    creds.baseUrl,
    `/api/mcp/endpoint/${endpointId}/`,
    {
      method: "PATCH",
      headers: authHeader(creds),
      body: JSON.stringify(params),
    },
  );
}

/**
 * Delete an MCP endpoint.
 * DELETE /api/mcp/endpoint/{endpoint_id}/
 */
export async function deleteMcpEndpoint(
  creds: BaserowCredentials,
  endpointId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/mcp/endpoint/${endpointId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

// ============================================================================
// ─── Health & Settings  (Sprint 5) ──────────────────────────────────────────
// ============================================================================

export type BaserowSettings = {
  instance_id: string;
  is_first_login: boolean;
  allow_new_user_signup: boolean;
  allow_reset_password: boolean;
  allow_global_view_sharing: boolean;
  baserow_embedded_share_url?: string;
  show_user_notifications?: boolean;
};

/**
 * Get basic health status for the instance.
 * GET /api/_health/
 */
export async function getHealth(baseUrl: string): Promise<{ status: string }> {
  return request<{ status: string }>(baseUrl, "/api/_health/");
}

/**
 * Get detailed 'full' health status.
 * GET /api/_health/full/
 */
export async function getFullHealth(baseUrl: string): Promise<unknown> {
  return request(baseUrl, "/api/_health/full/");
}

/**
 * Check celery queue health.
 * GET /api/_health/celery-queue/
 */
export async function getCeleryHealth(baseUrl: string): Promise<unknown> {
  return request(baseUrl, "/api/_health/celery-queue/");
}

/**
 * Test email configuration health.
 * POST /api/_health/email/
 */
export async function testEmailHealth(baseUrl: string): Promise<unknown> {
  return request(baseUrl, "/api/_health/email/", { method: "POST" });
}

/**
 * Get public settings for the Baserow instance.
 * GET /api/settings/
 */
export async function getSettings(baseUrl: string): Promise<BaserowSettings> {
  return request<BaserowSettings>(baseUrl, "/api/settings/");
}

/**
 * Get instance ID.
 * GET /api/settings/instance-id/
 */
export async function getInstanceId(baseUrl: string): Promise<{ instance_id: string }> {
  return request<{ instance_id: string }>(baseUrl, "/api/settings/instance-id/");
}

/**
 * Update instance settings (requires staff/admin).
 * PATCH /api/settings/update/
 */
export async function updateSettings(
  creds: BaserowCredentials,
  params: Partial<BaserowSettings>,
): Promise<BaserowSettings> {
  return request<BaserowSettings>(creds.baseUrl, "/api/settings/update/", {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

// ============================================================================
// ─── Public Audit Log (Sprint 5+) ───────────────────────────────────────────
// ============================================================================

/**
 * List public audit log entries.
 * GET /api/audit-log/
 */
export async function listPublicAuditLog(
  creds: BaserowCredentials,
  params?: any,
): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  return request(creds.baseUrl, `/api/audit-log/?${qs}`, {
    headers: authHeader(creds),
  });
}

/**
 * List public audit log action types.
 * GET /api/audit-log/action-types/
 */
export async function listPublicAuditLogActionTypes(
  creds: BaserowCredentials,
): Promise<any> {
  return request(creds.baseUrl, "/api/audit-log/action-types/", {
    headers: authHeader(creds),
  });
}

/**
 * Export public audit log.
 * POST /api/audit-log/export/
 */
export async function exportPublicAuditLog(
  creds: BaserowCredentials,
  params: any,
): Promise<any> {
  return request(creds.baseUrl, "/api/audit-log/export/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

// ============================================================================
// ─── Teams  (Sprint 5) ──────────────────────────────────────────────────────
// ============================================================================

export type BaserowTeam = {
  id: number;
  name: string;
  workspace_id: number;
  subject_count: number;
};

/**
 * List all teams in a workspace.
 * GET /api/teams/workspace/{workspace_id}/
 */
export async function listTeams(
  creds: BaserowCredentials,
  workspaceId: number,
): Promise<BaserowTeam[]> {
  return request<BaserowTeam[]>(creds.baseUrl, `/api/teams/workspace/${workspaceId}/`, {
    headers: authHeader(creds),
  });
}

/**
 * Create a new team.
 * POST /api/teams/workspace/{workspace_id}/
 */
export async function createTeam(
  creds: BaserowCredentials,
  workspaceId: number,
  params: { name: string },
): Promise<BaserowTeam> {
  return request<BaserowTeam>(creds.baseUrl, `/api/teams/workspace/${workspaceId}/`, {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Update a team's name.
 * PATCH /api/teams/{team_id}/
 */
export async function updateTeam(
  creds: BaserowCredentials,
  teamId: number,
  params: { name: string },
): Promise<BaserowTeam> {
  return request<BaserowTeam>(creds.baseUrl, `/api/teams/${teamId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a team.
 * DELETE /api/teams/{team_id}/
 */
export async function deleteTeam(
  creds: BaserowCredentials,
  teamId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/teams/${teamId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

// ============================================================================
// ─── Database Tokens  (Sprint 5) ────────────────────────────────────────────
// ============================================================================

export type DatabaseToken = {
  id: number;
  name: string;
  workspace_id: number;
  key: string;
  permissions: unknown;
};

/**
 * List all database tokens.
 * GET /api/database/tokens/
 */
export async function listDatabaseTokens(
  creds: BaserowCredentials,
): Promise<DatabaseToken[]> {
  return request<DatabaseToken[]>(creds.baseUrl, "/api/database/tokens/", {
    headers: authHeader(creds),
  });
}

/**
 * Create a new database token.
 * POST /api/database/tokens/
 */
export async function createDatabaseToken(
  creds: BaserowCredentials,
  params: { name: string; workspace_id: number },
): Promise<DatabaseToken> {
  return request<DatabaseToken>(creds.baseUrl, "/api/database/tokens/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Update a database token.
 * PATCH /api/database/tokens/{token_id}/
 */
export async function updateDatabaseToken(
  creds: BaserowCredentials,
  tokenId: number,
  params: { name?: string },
): Promise<DatabaseToken> {
  return request<DatabaseToken>(creds.baseUrl, `/api/database/tokens/${tokenId}/`, {
    method: "PATCH",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Delete a database token.
 * DELETE /api/database/tokens/{token_id}/
 */
export async function deleteDatabaseToken(
  creds: BaserowCredentials,
  tokenId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/database/tokens/${tokenId}/`, {
    method: "DELETE",
    headers: authHeader(creds),
  });
}

/**
 * Rotate a database token's key.
 * POST /api/database/tokens/{token_id}/rotate-key/
 */
export async function rotateDatabaseTokenKey(
  creds: BaserowCredentials,
  tokenId: number,
): Promise<{ key: string }> {
  return request<{ key: string }>(creds.baseUrl, `/api/database/tokens/${tokenId}/rotate-key/`, {
    method: "POST",
    headers: authHeader(creds),
  });
}

// ============================================================================
// ─── Jobs & Search  (Sprint 5+) ─────────────────────────────────────────────
// ============================================================================

/**
 * List all background jobs.
 * GET /api/jobs/
 */
export async function listJobs(creds: BaserowCredentials): Promise<any[]> {
  return request<any[]>(creds.baseUrl, "/api/jobs/", {
    headers: authHeader(creds),
  });
}

/**
 * Create a new background job.
 * POST /api/jobs/
 */
export async function createJob(
  creds: BaserowCredentials,
  params: any,
): Promise<any> {
  return request<any>(creds.baseUrl, "/api/jobs/", {
    method: "POST",
    headers: authHeader(creds),
    body: JSON.stringify(params),
  });
}

/**
 * Cancel a background job.
 * POST /api/jobs/{job_id}/cancel/
 */
export async function cancelJob(
  creds: BaserowCredentials,
  jobId: number,
): Promise<void> {
  await request<void>(creds.baseUrl, `/api/jobs/${jobId}/cancel/`, {
    method: "POST",
    headers: authHeader(creds),
  });
}

/**
 * Search across a workspace.
 * GET /api/search/workspace/{workspace_id}/
 */
export async function searchWorkspace(
  creds: BaserowCredentials,
  workspaceId: number,
  params: { search: string; page?: number; size?: number },
): Promise<any> {
  const qs = new URLSearchParams(params as any).toString();
  return request(creds.baseUrl, `/api/search/workspace/${workspaceId}/?${qs}`, {
    headers: authHeader(creds),
  });
}

// ============================================================================
// ─── Public & Form Views  (Sprint 5+) ───────────────────────────────────────
// ============================================================================

/**
 * Get public grid view rows.
 * GET /api/database/views/grid/{slug}/public/rows/
 */
export async function getPublicGridViewRows(
  baseUrl: string,
  slug: string,
  params?: any,
): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  return request(baseUrl, `/api/database/views/grid/${slug}/public/rows/?${qs}`);
}

/**
 * Get public grid view aggregations.
 * GET /api/database/views/grid/{slug}/public/aggregations/
 */
export async function getPublicGridViewAggregations(
  baseUrl: string,
  slug: string,
  params?: any,
): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  return request(baseUrl, `/api/database/views/grid/${slug}/public/aggregations/?${qs}`);
}

/**
 * Submit a form view.
 * POST /api/database/views/form/{slug}/submit/
 */
export async function submitFormView(
  baseUrl: string,
  slug: string,
  payload: any,
): Promise<any> {
  return request(baseUrl, `/api/database/views/form/${slug}/submit/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get form view details for submission.
 * GET /api/database/views/form/{slug}/submit/
 */
export async function getFormViewForSubmit(
  baseUrl: string,
  slug: string,
): Promise<any> {
  return request(baseUrl, `/api/database/views/form/${slug}/submit/`);
}




