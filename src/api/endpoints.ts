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
};
