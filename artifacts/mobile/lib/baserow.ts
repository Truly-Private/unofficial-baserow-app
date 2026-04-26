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

export async function createApplicationSnapshot(
  creds: BaserowCredentials,
  applicationId: number,
): Promise<BaserowApplicationSnapshot> {
  return request<BaserowApplicationSnapshot>(
    creds.baseUrl,
    `/api/snapshots/application/${applicationId}/`,
    {
      method: "POST",
      headers: authHeader(creds),
    },
  );
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
  return res.json();
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
  // Use the streaming response and collect the final message
  const stream = await sendAssistantMessage(creds, chatUuid, content, uiContext);
  const reader = stream[Symbol.asyncIterator]();
  let result = "";
  let messageId: number | null = null;
  
  // Note: In a real implementation, you'd parse SSE events here
  // For now, this is a placeholder that returns the request status
  return { id: 0, content: "Message sent" };
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
