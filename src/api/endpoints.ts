// Endpoint builders for Baserow-like API
export const API_BASE = "/api";

export const Endpoints = {
  auth: {
    // Real Baserow authentication endpoints
    // See: https://baserow.io/docs/apis/rest-api
    login: () => `${API_BASE}/user/token-auth/`,
    refresh: () => `${API_BASE}/user/token-refresh/`,
    me: () => `${API_BASE}/user/me/`,
  },
  databases: {
    list: () => `${API_BASE}/database/databases/`,
    detail: (dbId: string) => `${API_BASE}/database/databases/${dbId}/`,
  },
  tables: {
    list: (dbId: string) => `${API_BASE}/database/databases/${dbId}/tables/`,
    detail: (dbId: string, tableId: string) =>
      `${API_BASE}/database/databases/${dbId}/tables/${tableId}/`,
  },
  rows: {
    list: (tableId: string) => `${API_BASE}/database/rows/table/${tableId}/`,
    detail: (tableId: string, rowId: string) =>
      `${API_BASE}/database/rows/table/${tableId}/${rowId}/`,
  },
  views: {
    list: (dbId: string, tableId: string) =>
      `${API_BASE}/database/databases/${dbId}/tables/${tableId}/views/`,
    detail: (dbId: string, tableId: string, viewId: string) =>
      `${API_BASE}/database/databases/${dbId}/tables/${tableId}/views/${viewId}/`,
  },
  fields: {
    list: (dbId: string, tableId: string) =>
      `${API_BASE}/database/databases/${dbId}/tables/${tableId}/fields/`,
    detail: (dbId: string, tableId: string, fieldId: string) =>
      `${API_BASE}/database/databases/${dbId}/tables/${tableId}/fields/${fieldId}/`,
    tableList: (tableId: string | number) =>
      `${API_BASE}/database/fields/table/${tableId}/`,
    fieldDetail: (fieldId: string | number) =>
      `${API_BASE}/database/fields/${fieldId}/`,
  },
  selectOptions: {
    list: (fieldId: string | number) =>
      `${API_BASE}/database/fields/${fieldId}/select-options/`,
    detail: (fieldId: string | number, optionId: string | number) =>
      `${API_BASE}/database/fields/${fieldId}/select-options/${optionId}/`,
  },
  attachments: {
    upload: (dbId: string, tableId: string, rowId: string) =>
      `${API_BASE}/database/databases/${dbId}/tables/${tableId}/rows/${rowId}/attachments/`,
  },
  // Views API
  viewsFull: {
    list: (tableId: number) => `${API_BASE}/database/views/table/${tableId}/`,
    detail: (viewId: number) => `${API_BASE}/database/views/${viewId}/`,
    create: (tableId: number) => `${API_BASE}/database/views/table/${tableId}/`,
    update: (viewId: number) => `${API_BASE}/database/views/${viewId}/`,
    delete: (viewId: number) => `${API_BASE}/database/views/${viewId}/`,
    order: (tableId: number) => `${API_BASE}/database/views/table/${tableId}/order/`,
    duplicate: (viewId: number) => `${API_BASE}/database/views/${viewId}/duplicate/`,
  },
  // Filters API
  viewFilters: {
    list: (viewId: number) => `${API_BASE}/database/views/${viewId}/filters/`,
    create: (viewId: number) => `${API_BASE}/database/views/${viewId}/filters/`,
    detail: (filterId: number) => `${API_BASE}/database/views/filter/${filterId}/`,
    delete: (filterId: number) => `${API_BASE}/database/views/filter/${filterId}/`,
  },
  // Sortings API
  viewSortings: {
    list: (viewId: number) => `${API_BASE}/database/views/${viewId}/sortings/`,
    create: (viewId: number) => `${API_BASE}/database/views/${viewId}/sortings/`,
    detail: (sortingId: number) => `${API_BASE}/database/views/sorting/${sortingId}/`,
    delete: (sortingId: number) => `${API_BASE}/database/views/sorting/${sortingId}/`,
  },
  // Webhooks API
  webhooks: {
    list: (tableId: number) => `${API_BASE}/database/webhooks/table/${tableId}/`,
    create: (tableId: number) => `${API_BASE}/database/webhooks/table/${tableId}/`,
    detail: (webhookId: number) => `${API_BASE}/database/webhooks/${webhookId}/`,
    update: (webhookId: number) => `${API_BASE}/database/webhooks/${webhookId}/`,
    delete: (webhookId: number) => `${API_BASE}/database/webhooks/${webhookId}/`,
    testCall: (tableId: number) => `${API_BASE}/database/webhooks/table/${tableId}/test-call/`,
  },
  // Automation API
  automation: {
    workflowsList: (automationId: number) =>
      `${API_BASE}/automation/${automationId}/workflows/`,
    workflowsCreate: (automationId: number) =>
      `${API_BASE}/automation/${automationId}/workflows/`,
    workflowDetail: (workflowId: number) =>
      `${API_BASE}/automation/workflows/${workflowId}/`,
    workflowUpdate: (workflowId: number) =>
      `${API_BASE}/automation/workflows/${workflowId}/`,
    workflowDelete: (workflowId: number) =>
      `${API_BASE}/automation/workflows/${workflowId}/`,
    workflowPublish: (workflowId: number) =>
      `${API_BASE}/automation/workflows/${workflowId}/publish/async/`,
    workflowTest: (workflowId: number) =>
      `${API_BASE}/automation/workflows/${workflowId}/test/`,
    nodesList: (workflowId: number) =>
      `${API_BASE}/automation/workflow/${workflowId}/nodes/`,
    nodesCreate: (workflowId: number) =>
      `${API_BASE}/automation/workflow/${workflowId}/nodes/`,
    nodesDetail: (nodeId: number) => `${API_BASE}/automation/node/${nodeId}/`,
    nodesUpdate: (nodeId: number) => `${API_BASE}/automation/node/${nodeId}/`,
    nodesDelete: (nodeId: number) => `${API_BASE}/automation/node/${nodeId}/`,
  },
  // Teams API
  teams: {
    list: (workspaceId: number) => `${API_BASE}/teams/workspace/${workspaceId}/`,
    create: (workspaceId: number) => `${API_BASE}/teams/workspace/${workspaceId}/`,
    detail: (teamId: number) => `${API_BASE}/teams/${teamId}/`,
    update: (teamId: number) => `${API_BASE}/teams/${teamId}/`,
    delete: (teamId: number) => `${API_BASE}/teams/${teamId}/`,
    subjectsList: (teamId: number) => `${API_BASE}/teams/${teamId}/subjects/`,
    subjectsCreate: (teamId: number) => `${API_BASE}/teams/${teamId}/subjects/`,
    subjectsDelete: (teamId: number, subjectId: number) =>
      `${API_BASE}/teams/${teamId}/subjects/${subjectId}/`,
  },
  // Roles API
  roles: {
    list: (workspaceId: number) => `${API_BASE}/role/${workspaceId}/`,
    assign: (workspaceId: number) => `${API_BASE}/role/${workspaceId}/`,
    batchAssign: (workspaceId: number) => `${API_BASE}/role/${workspaceId}/batch/`,
  },
  // Notifications API
  notifications: {
    list: (workspaceId: number) => `${API_BASE}/notifications/${workspaceId}/`,
    markRead: (workspaceId: number, notificationId: number) =>
      `${API_BASE}/notifications/${workspaceId}/${notificationId}/`,
    markAllRead: (workspaceId: number) =>
      `${API_BASE}/notifications/${workspaceId}/mark-all-as-read/`,
  },
  // Trash API
  trash: {
    globalStructure: () => `${API_BASE}/trash/`,
    restore: () => `${API_BASE}/trash/restore/`,
    workspaceContents: (workspaceId: number) =>
      `${API_BASE}/trash/workspace/${workspaceId}/`,
    emptyWorkspace: (workspaceId: number) =>
      `${API_BASE}/trash/workspace/${workspaceId}/`,
  },
};
