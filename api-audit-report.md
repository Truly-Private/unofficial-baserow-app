# Baserow API Coverage Audit

> Generated: 2026-05-02T01:58:14.178Z
> App: `http://localhost:3000` | Baserow Cloud: `https://api.baserow.io`
> ⚠️ HTTP calls skipped (--no-http flag)

---

## Summary

`███████░░░` **73% solid coverage** (278 exact + 79 fuzzy matches out of 381 endpoints)

| Metric | Value |
|--------|-------|
| Total endpoints in spec | 381 |
| Solid match (exact skeleton + method) | 278 |
| Fuzzy match (partial / method mismatch) | 79 |
| Not implemented | 24 |
| App responds (non-404/502) | 0 / 381 |

---

## 🔴 Unimplemented Endpoints

> No matching function found in `baserow.ts` or `admin.ts`.

### Audit log (1 missing)
- `GET` `/api/audit-log/`
  (no description)

### Auth (3 missing)
- `POST` `/api/sso/saml/acs/`
  (no description)
- `GET` `/api/sso/saml/login/`
  (no description)
- `GET` `/api/sso/saml/login-url/`
  (no description)

### Admin (6 missing)
- `POST` `/api/licenses/{id}/{user_id}/`
  (no description)
- `DELETE` `/api/licenses/{id}/{user_id}/`
  (no description)
- `GET` `/api/licenses/{id}/check/`
  (no description)
- `POST` `/api/licenses/{id}/fill-seats/`
  (no description)
- `GET` `/api/licenses/{id}/lookup-users/`
  (no description)
- `POST` `/api/licenses/{id}/remove-all-users/`
  (no description)

### Admin data scanner (1 missing)
- `GET` `/api/admin/data-scanner/results/`
  (no description)

### User sources (7 missing)
- `POST` `/api/user-source-auth-refresh/`
  (no description)
- `POST` `/api/user-source-token-blacklist/`
  (no description)
- `POST` `/api/user-source/{user_source_id}/force-token-auth`
  (no description)
- `GET` `/api/user-source/{user_source_uid}/sso/oauth2/openid_connect/callback/`
  (no description)
- `GET` `/api/user-source/{user_source_uid}/sso/oauth2/openid_connect/login/`
  (no description)
- `GET` `/api/user-source/{user_source_uid}/sso/saml/login/`
  (no description)
- `POST` `/api/user-source/sso/saml/acs/`
  (no description)

### Builder domains (1 missing)
- `GET` `/api/builder/domains/ask-public-domain-exists/`
  (no description)

### Database tables (1 missing)
- `POST` `/api/database/data-sync/properties/`
  (no description)

### Database table fields (1 missing)
- `POST` `/api/database/fields/password-authentication/`
  (no description)

### Database table rows (1 missing)
- `GET` `/api/database/rows/names/`
  (no description)

### Secure file serve (1 missing)
- `GET` `/api/files/{signed_data}`
  (no description)

### User files (1 missing)
- `POST` `/api/user-files/upload-file/`
  (no description)

---

## Per-Section Detail

### Health
`██████████` 100% — **3** exact · **0** fuzzy · **0** missing of 3

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/_health/celery-queue/` |  | ⏭️ | ⏭️ | `getCeleryHealth (baserow.ts)` |
| 🟢 | `POST` | `/api/_health/email/` |  | ⏭️ | ⏭️ | `testEmailHealth (baserow.ts)` |
| 🟢 | `GET` | `/api/_health/full/` |  | ⏭️ | ⏭️ | `getFullHealth (baserow.ts)` |

### Audit log
`█████████░` 88% — **7** exact · **0** fuzzy · **1** missing of 8

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/admin/audit-log/` |  | ⏭️ | ⏭️ | `listAuditLog (admin.ts)` |
| 🟢 | `GET` | `/api/admin/audit-log/action-types/` |  | ⏭️ | ⏭️ | `listAuditLogActionTypes (admin.ts)` |
| 🟢 | `POST` | `/api/admin/audit-log/export/` |  | ⏭️ | ⏭️ | `exportAuditLog (admin.ts)` |
| 🟢 | `GET` | `/api/admin/audit-log/users/` |  | ⏭️ | ⏭️ | `listAuditLogUsers (admin.ts)` |
| 🔴 | `GET` | `/api/audit-log/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `GET` | `/api/audit-log/action-types/` |  | ⏭️ | ⏭️ | `listPublicAuditLogActionTypes (baserow.ts)` |
| 🟢 | `POST` | `/api/audit-log/export/` |  | ⏭️ | ⏭️ | `exportPublicAuditLog (baserow.ts)` |
| 🟢 | `GET` | `/api/audit-log/users/` |  | ⏭️ | ⏭️ | `listAuditLogUsers (baserow.ts)` |

### Auth
`███████░░░` 67% — **10** exact · **2** fuzzy · **3** missing of 15

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/admin/auth-provider/` |  | ⏭️ | ⏭️ | `listAuthProviders (admin.ts)` |
| 🟢 | `POST` | `/api/admin/auth-provider/` |  | ⏭️ | ⏭️ | `createAuthProvider (admin.ts)` |
| 🟢 | `GET` | `/api/admin/auth-provider/{auth_provider_id}/` |  | ⏭️ | ⏭️ | `getAuthProvider (admin.ts)` |
| 🟢 | `PATCH` | `/api/admin/auth-provider/{auth_provider_id}/` |  | ⏭️ | ⏭️ | `updateAuthProvider (admin.ts)` |
| 🟢 | `DELETE` | `/api/admin/auth-provider/{auth_provider_id}/` |  | ⏭️ | ⏭️ | `deleteAuthProvider (admin.ts)` |
| 🟢 | `GET` | `/api/auth-provider/login-options/` |  | ⏭️ | ⏭️ | `getLoginOptions (baserow.ts)` |
| 🟡 | `GET` | `/api/sso/oauth2/callback/{provider_id}/` |  | ⏭️ | ⏭️ | `listComments? (baserow.ts)` |
| 🟡 | `GET` | `/api/sso/oauth2/login/{provider_id}/` |  | ⏭️ | ⏭️ | `listComments? (baserow.ts)` |
| 🔴 | `POST` | `/api/sso/saml/acs/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `GET` | `/api/sso/saml/login/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `GET` | `/api/sso/saml/login-url/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `GET` | `/api/two-factor-auth/configuration/` |  | ⏭️ | ⏭️ | `get2FAConfiguration (baserow.ts)` |
| 🟢 | `POST` | `/api/two-factor-auth/configuration/` |  | ⏭️ | ⏭️ | `configure2FA (baserow.ts)` |
| 🟢 | `POST` | `/api/two-factor-auth/disable/` |  | ⏭️ | ⏭️ | `disable2FA (baserow.ts)` |
| 🟢 | `POST` | `/api/two-factor-auth/verify/` |  | ⏭️ | ⏭️ | `verify2FA (baserow.ts)` |

### Admin
`███████░░░` 68% — **13** exact · **0** fuzzy · **6** missing of 19

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/admin/dashboard/` |  | ⏭️ | ⏭️ | `getAdminDashboard (baserow.ts)` |
| 🟢 | `GET` | `/api/admin/users/` |  | ⏭️ | ⏭️ | `listAdminUsers (admin.ts)` |
| 🟢 | `POST` | `/api/admin/users/` |  | ⏭️ | ⏭️ | `createAdminUser (admin.ts)` |
| 🟢 | `PATCH` | `/api/admin/users/{user_id}/` |  | ⏭️ | ⏭️ | `updateAdminUser (admin.ts)` |
| 🟢 | `DELETE` | `/api/admin/users/{user_id}/` |  | ⏭️ | ⏭️ | `deleteAdminUser (admin.ts)` |
| 🟢 | `POST` | `/api/admin/users/impersonate/` |  | ⏭️ | ⏭️ | `impersonateAdminUser (admin.ts)` |
| 🟢 | `GET` | `/api/admin/workspaces/` |  | ⏭️ | ⏭️ | `listAdminWorkspaces (admin.ts)` |
| 🟢 | `DELETE` | `/api/admin/workspaces/{workspace_id}/` |  | ⏭️ | ⏭️ | `deleteAdminWorkspace (admin.ts)` |
| 🟢 | `GET` | `/api/admin/workspaces/options/` |  | ⏭️ | ⏭️ | `listAdminWorkspaceOptions (admin.ts)` |
| 🟢 | `GET` | `/api/licenses/` |  | ⏭️ | ⏭️ | `listAdminLicenses (baserow.ts)` |
| 🟢 | `POST` | `/api/licenses/` |  | ⏭️ | ⏭️ | `registerAdminLicense (baserow.ts)` |
| 🟢 | `GET` | `/api/licenses/{id}/` |  | ⏭️ | ⏭️ | `getAdminLicense (baserow.ts)` |
| 🟢 | `DELETE` | `/api/licenses/{id}/` |  | ⏭️ | ⏭️ | `deleteAdminLicense (baserow.ts)` |
| 🔴 | `POST` | `/api/licenses/{id}/{user_id}/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `DELETE` | `/api/licenses/{id}/{user_id}/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `GET` | `/api/licenses/{id}/check/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `POST` | `/api/licenses/{id}/fill-seats/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `GET` | `/api/licenses/{id}/lookup-users/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `POST` | `/api/licenses/{id}/remove-all-users/` |  | ⏭️ | ⏭️ | — |

### Admin data scanner
`████████░░` 80% — **8** exact · **1** fuzzy · **1** missing of 10

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🔴 | `GET` | `/api/admin/data-scanner/results/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `DELETE` | `/api/admin/data-scanner/results/{result_id}/` |  | ⏭️ | ⏭️ | `deleteDataScanResult (admin.ts)` |
| 🟢 | `POST` | `/api/admin/data-scanner/results/export/` |  | ⏭️ | ⏭️ | `exportDataScanResults (admin.ts)` |
| 🟡 | `GET` | `/api/admin/data-scanner/scans/` |  | ⏭️ | ⏭️ | `createDataScan? (admin.ts)` |
| 🟢 | `POST` | `/api/admin/data-scanner/scans/` |  | ⏭️ | ⏭️ | `createDataScan (admin.ts)` |
| 🟢 | `GET` | `/api/admin/data-scanner/scans/{scan_id}/` |  | ⏭️ | ⏭️ | `getDataScan (admin.ts)` |
| 🟢 | `PATCH` | `/api/admin/data-scanner/scans/{scan_id}/` |  | ⏭️ | ⏭️ | `updateDataScan (admin.ts)` |
| 🟢 | `DELETE` | `/api/admin/data-scanner/scans/{scan_id}/` |  | ⏭️ | ⏭️ | `deleteDataScan (admin.ts)` |
| 🟢 | `POST` | `/api/admin/data-scanner/scans/{scan_id}/trigger/` |  | ⏭️ | ⏭️ | `triggerDataScan (admin.ts)` |
| 🟢 | `GET` | `/api/admin/data-scanner/workspace-structure/{workspace_id}/` |  | ⏭️ | ⏭️ | `getDataScannerWorkspaceStructure (admin.ts)` |

### Integrations
`██████████` 100% — **5** exact · **0** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/application/{application_id}/integrations/` |  | ⏭️ | ⏭️ | `listApplicationIntegrations (baserow.ts)` |
| 🟢 | `POST` | `/api/application/{application_id}/integrations/` |  | ⏭️ | ⏭️ | `createApplicationIntegration (baserow.ts)` |
| 🟢 | `PATCH` | `/api/integration/{integration_id}/` |  | ⏭️ | ⏭️ | `updateApplicationIntegration (baserow.ts)` |
| 🟢 | `DELETE` | `/api/integration/{integration_id}/` |  | ⏭️ | ⏭️ | `deleteApplicationIntegration (baserow.ts)` |
| 🟢 | `PATCH` | `/api/integration/{integration_id}/move/` |  | ⏭️ | ⏭️ | `moveApplicationIntegration (baserow.ts)` |

### User sources
`█████░░░░░` 50% — **7** exact · **0** fuzzy · **7** missing of 14

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/application/{application_id}/list-user-source-users/` |  | ⏭️ | ⏭️ | `listApplicationUserSourceUsers (baserow.ts)` |
| 🟢 | `GET` | `/api/application/{application_id}/user-sources/` |  | ⏭️ | ⏭️ | `listApplicationUserSources (baserow.ts)` |
| 🟢 | `POST` | `/api/application/{application_id}/user-sources/` |  | ⏭️ | ⏭️ | `createApplicationUserSource (baserow.ts)` |
| 🔴 | `POST` | `/api/user-source-auth-refresh/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `POST` | `/api/user-source-token-blacklist/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `PATCH` | `/api/user-source/{user_source_id}/` |  | ⏭️ | ⏭️ | `updateUserSource (baserow.ts)` |
| 🟢 | `DELETE` | `/api/user-source/{user_source_id}/` |  | ⏭️ | ⏭️ | `deleteUserSource (baserow.ts)` |
| 🔴 | `POST` | `/api/user-source/{user_source_id}/force-token-auth` |  | ⏭️ | ⏭️ | — |
| 🟢 | `PATCH` | `/api/user-source/{user_source_id}/move/` |  | ⏭️ | ⏭️ | `moveUserSource (baserow.ts)` |
| 🟢 | `POST` | `/api/user-source/{user_source_id}/token-auth` |  | ⏭️ | ⏭️ | `authenticateUserSource (baserow.ts)` |
| 🔴 | `GET` | `/api/user-source/{user_source_uid}/sso/oauth2/openid_connect/callback/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `GET` | `/api/user-source/{user_source_uid}/sso/oauth2/openid_connect/login/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `GET` | `/api/user-source/{user_source_uid}/sso/saml/login/` |  | ⏭️ | ⏭️ | — |
| 🔴 | `POST` | `/api/user-source/sso/saml/acs/` |  | ⏭️ | ⏭️ | — |

### User source roles
`██████████` 100% — **1** exact · **0** fuzzy · **0** missing of 1

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/application/{application_id}/user-sources/roles/` |  | ⏭️ | ⏭️ | `listApplicationUserSourceRoles (baserow.ts)` |

### Applications
`████████░░` 75% — **6** exact · **2** fuzzy · **0** missing of 8

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/applications/` |  | ⏭️ | ⏭️ | `listApplications (baserow.ts)` |
| 🟢 | `GET` | `/api/applications/{application_id}/` |  | ⏭️ | ⏭️ | `getApplication (baserow.ts)` |
| 🟢 | `PATCH` | `/api/applications/{application_id}/` |  | ⏭️ | ⏭️ | `updateApplication (baserow.ts)` |
| 🟢 | `DELETE` | `/api/applications/{application_id}/` |  | ⏭️ | ⏭️ | `deleteApplication (baserow.ts)` |
| 🟢 | `POST` | `/api/applications/{application_id}/duplicate/async/` |  | ⏭️ | ⏭️ | `duplicateApplicationAsync (baserow.ts)` |
| 🟡 | `GET` | `/api/applications/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `createApplication? (baserow.ts)` |
| 🟢 | `POST` | `/api/applications/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `createApplication (baserow.ts)` |
| 🟡 | `POST` | `/api/applications/workspace/{workspace_id}/order/` |  | ⏭️ | ⏭️ | `createApplication? (baserow.ts)` |

### Automation workflows
`██████████` 100% — **9** exact · **0** fuzzy · **0** missing of 9

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `POST` | `/api/automation/{automation_id}/workflows/` |  | ⏭️ | ⏭️ | `createAutomationWorkflow (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/{automation_id}/workflows/order/` |  | ⏭️ | ⏭️ | `orderAutomationWorkflows (baserow.ts)` |
| 🟢 | `GET` | `/api/automation/workflows/{workflow_id}/` |  | ⏭️ | ⏭️ | `getAutomationWorkflow (baserow.ts)` |
| 🟢 | `PATCH` | `/api/automation/workflows/{workflow_id}/` |  | ⏭️ | ⏭️ | `updateAutomationWorkflow (baserow.ts)` |
| 🟢 | `DELETE` | `/api/automation/workflows/{workflow_id}/` |  | ⏭️ | ⏭️ | `deleteAutomationWorkflow (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/workflows/{workflow_id}/duplicate/async/` |  | ⏭️ | ⏭️ | `duplicateAutomationWorkflowAsync (baserow.ts)` |
| 🟢 | `GET` | `/api/automation/workflows/{workflow_id}/history/` |  | ⏭️ | ⏭️ | `getAutomationWorkflowHistory (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/workflows/{workflow_id}/publish/async/` |  | ⏭️ | ⏭️ | `publishAutomationWorkflowAsync (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/workflows/{workflow_id}/test/` |  | ⏭️ | ⏭️ | `testAutomationWorkflow (baserow.ts)` |

### Automation nodes
`██████████` 100% — **8** exact · **0** fuzzy · **0** missing of 8

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `PATCH` | `/api/automation/node/{node_id}/` |  | ⏭️ | ⏭️ | `updateAutomationNode (baserow.ts)` |
| 🟢 | `DELETE` | `/api/automation/node/{node_id}/` |  | ⏭️ | ⏭️ | `deleteAutomationNode (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/node/{node_id}/duplicate/` |  | ⏭️ | ⏭️ | `duplicateAutomationNode (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/node/{node_id}/move/` |  | ⏭️ | ⏭️ | `moveAutomationNode (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/node/{node_id}/replace/` |  | ⏭️ | ⏭️ | `replaceAutomationNode (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/node/{node_id}/simulate-dispatch/` |  | ⏭️ | ⏭️ | `simulateDispatchAutomationNode (baserow.ts)` |
| 🟢 | `GET` | `/api/automation/workflow/{workflow_id}/nodes/` |  | ⏭️ | ⏭️ | `listAutomationNodes (baserow.ts)` |
| 🟢 | `POST` | `/api/automation/workflow/{workflow_id}/nodes/` |  | ⏭️ | ⏭️ | `createAutomationNode (baserow.ts)` |

### Builder domains
`█████████░` 86% — **6** exact · **0** fuzzy · **1** missing of 7

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/builder/{builder_id}/domains/` |  | ⏭️ | ⏭️ | `listBuilderDomains (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/{builder_id}/domains/` |  | ⏭️ | ⏭️ | `createBuilderDomain (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/{builder_id}/domains/order/` |  | ⏭️ | ⏭️ | `orderBuilderDomains (baserow.ts)` |
| 🟢 | `PATCH` | `/api/builder/domains/{domain_id}/` |  | ⏭️ | ⏭️ | `updateBuilderDomain (baserow.ts)` |
| 🟢 | `DELETE` | `/api/builder/domains/{domain_id}/` |  | ⏭️ | ⏭️ | `deleteBuilderDomain (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/domains/{domain_id}/publish/async/` |  | ⏭️ | ⏭️ | `publishBuilderDomainAsync (baserow.ts)` |
| 🔴 | `GET` | `/api/builder/domains/ask-public-domain-exists/` |  | ⏭️ | ⏭️ | — |

### Builder pages
`██████████` 100% — **5** exact · **0** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `POST` | `/api/builder/{builder_id}/pages/` |  | ⏭️ | ⏭️ | `createBuilderPage (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/{builder_id}/pages/order/` |  | ⏭️ | ⏭️ | `orderBuilderPages (baserow.ts)` |
| 🟢 | `PATCH` | `/api/builder/pages/{page_id}/` |  | ⏭️ | ⏭️ | `updateBuilderPage (baserow.ts)` |
| 🟢 | `DELETE` | `/api/builder/pages/{page_id}/` |  | ⏭️ | ⏭️ | `deleteBuilderPage (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/pages/{page_id}/duplicate/async/` |  | ⏭️ | ⏭️ | `duplicateBuilderPageAsync (baserow.ts)` |

### Builder theme
`██████████` 100% — **1** exact · **0** fuzzy · **0** missing of 1

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `PATCH` | `/api/builder/{builder_id}/theme/` |  | ⏭️ | ⏭️ | `updateBuilderTheme (baserow.ts)` |

### Builder data sources
`██████████` 100% — **11** exact · **0** fuzzy · **0** missing of 11

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `PATCH` | `/api/builder/data-source/{data_source_id}/` |  | ⏭️ | ⏭️ | `updateBuilderPageDataSource (baserow.ts)` |
| 🟢 | `DELETE` | `/api/builder/data-source/{data_source_id}/` |  | ⏭️ | ⏭️ | `deleteBuilderPageDataSource (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/data-source/{data_source_id}/dispatch/` |  | ⏭️ | ⏭️ | `dispatchBuilderPageDataSource (baserow.ts)` |
| 🟢 | `PATCH` | `/api/builder/data-source/{data_source_id}/move/` |  | ⏭️ | ⏭️ | `moveBuilderPageDataSource (baserow.ts)` |
| 🟢 | `GET` | `/api/builder/data-source/{data_source_id}/record-names/` |  | ⏭️ | ⏭️ | `getBuilderPageDataSourceRecordNames (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/domains/published/data-source/{data_source_id}/dispatch/` |  | ⏭️ | ⏭️ | `dispatchPublishedBuilderDataSource (baserow.ts)` |
| 🟢 | `GET` | `/api/builder/domains/published/page/{page_id}/data_sources/` |  | ⏭️ | ⏭️ | `listPublishedBuilderPageDataSources (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/domains/published/page/{page_id}/dispatch-data-sources/` |  | ⏭️ | ⏭️ | `dispatchPublishedBuilderPageDataSources (baserow.ts)` |
| 🟢 | `GET` | `/api/builder/page/{page_id}/data-sources/` |  | ⏭️ | ⏭️ | `listBuilderPageDataSources (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/page/{page_id}/data-sources/` |  | ⏭️ | ⏭️ | `createBuilderPageDataSource (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/page/{page_id}/dispatch-data-sources/` |  | ⏭️ | ⏭️ | `dispatchBuilderPageDataSources (baserow.ts)` |

### Builder public
`██████████` 100% — **6** exact · **0** fuzzy · **0** missing of 6

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/builder/domains/published/by_id/{builder_id}/` |  | ⏭️ | ⏭️ | `getPublicBuilderById (baserow.ts)` |
| 🟢 | `GET` | `/api/builder/domains/published/by_name/{domain_name}/` |  | ⏭️ | ⏭️ | `getPublicBuilderByName (baserow.ts)` |
| 🟢 | `GET` | `/api/custom_code/{builder_id}/css/` |  | ⏭️ | ⏭️ | `getBuilderCustomCss (baserow.ts)` |
| 🟢 | `GET` | `/api/custom_code/{builder_id}/css/public/` |  | ⏭️ | ⏭️ | `getPublicBuilderCustomCss (baserow.ts)` |
| 🟢 | `GET` | `/api/custom_code/{builder_id}/js/` |  | ⏭️ | ⏭️ | `getBuilderCustomJs (baserow.ts)` |
| 🟢 | `GET` | `/api/custom_code/{builder_id}/js/public/` |  | ⏭️ | ⏭️ | `getPublicBuilderCustomJs (baserow.ts)` |

### Builder elements
`██████████` 100% — **7** exact · **0** fuzzy · **0** missing of 7

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/builder/domains/published/page/{page_id}/elements/` |  | ⏭️ | ⏭️ | `listPublishedBuilderPageElements (baserow.ts)` |
| 🟢 | `PATCH` | `/api/builder/element/{element_id}/` |  | ⏭️ | ⏭️ | `updateBuilderPageElement (baserow.ts)` |
| 🟢 | `DELETE` | `/api/builder/element/{element_id}/` |  | ⏭️ | ⏭️ | `deleteBuilderPageElement (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/element/{element_id}/duplicate/` |  | ⏭️ | ⏭️ | `duplicateBuilderPageElement (baserow.ts)` |
| 🟢 | `PATCH` | `/api/builder/element/{element_id}/move/` |  | ⏭️ | ⏭️ | `moveBuilderPageElement (baserow.ts)` |
| 🟢 | `GET` | `/api/builder/page/{page_id}/elements/` |  | ⏭️ | ⏭️ | `listBuilderPageElements (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/page/{page_id}/elements/` |  | ⏭️ | ⏭️ | `createBuilderPageElement (baserow.ts)` |

### Builder workflow actions
`██████████` 100% — **7** exact · **0** fuzzy · **0** missing of 7

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/builder/domains/published/page/{page_id}/workflow_actions/` |  | ⏭️ | ⏭️ | `listPublishedBuilderPageWorkflowActions (baserow.ts)` |
| 🟢 | `GET` | `/api/builder/page/{page_id}/workflow_actions/` |  | ⏭️ | ⏭️ | `listBuilderPageWorkflowActions (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/page/{page_id}/workflow_actions/` |  | ⏭️ | ⏭️ | `createBuilderPageWorkflowAction (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/page/{page_id}/workflow_actions/order/` |  | ⏭️ | ⏭️ | `orderBuilderWorkflowActions (baserow.ts)` |
| 🟢 | `PATCH` | `/api/builder/workflow_action/{workflow_action_id}/` |  | ⏭️ | ⏭️ | `updateBuilderPageWorkflowAction (baserow.ts)` |
| 🟢 | `DELETE` | `/api/builder/workflow_action/{workflow_action_id}/` |  | ⏭️ | ⏭️ | `deleteBuilderPageWorkflowAction (baserow.ts)` |
| 🟢 | `POST` | `/api/builder/workflow_action/{workflow_action_id}/dispatch/` |  | ⏭️ | ⏭️ | `dispatchBuilderPageWorkflowAction (baserow.ts)` |

### Dashboard data sources
`██████████` 100% — **3** exact · **0** fuzzy · **0** missing of 3

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/dashboard/{dashboard_id}/data-sources/` |  | ⏭️ | ⏭️ | `listDashboardDataSources (baserow.ts)` |
| 🟢 | `PATCH` | `/api/dashboard/data-sources/{data_source_id}/` |  | ⏭️ | ⏭️ | `updateDashboardDataSource (baserow.ts)` |
| 🟢 | `POST` | `/api/dashboard/data-sources/{data_source_id}/dispatch/` |  | ⏭️ | ⏭️ | `dispatchDashboardDataSource (baserow.ts)` |

### Dashboard widgets
`██████████` 100% — **4** exact · **0** fuzzy · **0** missing of 4

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/dashboard/{dashboard_id}/widgets/` |  | ⏭️ | ⏭️ | `listDashboardWidgets (baserow.ts)` |
| 🟢 | `POST` | `/api/dashboard/{dashboard_id}/widgets/` |  | ⏭️ | ⏭️ | `createDashboardWidget (baserow.ts)` |
| 🟢 | `PATCH` | `/api/dashboard/widgets/{widget_id}/` |  | ⏭️ | ⏭️ | `updateDashboardWidget (baserow.ts)` |
| 🟢 | `DELETE` | `/api/dashboard/widgets/{widget_id}/` |  | ⏭️ | ⏭️ | `deleteDashboardWidget (baserow.ts)` |

### Database tables
`█████░░░░░` 50% — **9** exact · **8** fuzzy · **1** missing of 18

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/data-sync/{data_sync_id}/periodic-interval/` |  | ⏭️ | ⏭️ | `getDataSyncInterval (baserow.ts)` |
| 🟢 | `PATCH` | `/api/data-sync/{data_sync_id}/periodic-interval/` |  | ⏭️ | ⏭️ | `updateDataSyncInterval (baserow.ts)` |
| 🟢 | `GET` | `/api/database/data-sync/{data_sync_id}/` |  | ⏭️ | ⏭️ | `getDataSync (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/data-sync/{data_sync_id}/` |  | ⏭️ | ⏭️ | `updateDataSync (baserow.ts)` |
| 🟡 | `GET` | `/api/database/data-sync/{data_sync_id}/properties/` |  | ⏭️ | ⏭️ | `listDatabaseTables? (baserow.ts)` |
| 🟢 | `POST` | `/api/database/data-sync/{data_sync_id}/sync/async/` |  | ⏭️ | ⏭️ | `triggerDataSyncAsync (baserow.ts)` |
| 🟡 | `POST` | `/api/database/data-sync/database/{database_id}/` |  | ⏭️ | ⏭️ | `triggerDataSyncAsync? (baserow.ts)` |
| 🔴 | `POST` | `/api/database/data-sync/properties/` |  | ⏭️ | ⏭️ | — |
| 🟡 | `GET` | `/api/database/tables/{table_id}/` |  | ⏭️ | ⏭️ | `updateTable? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/tables/{table_id}/` |  | ⏭️ | ⏭️ | `updateTable (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/tables/{table_id}/` |  | ⏭️ | ⏭️ | `deleteTable (baserow.ts)` |
| 🟡 | `POST` | `/api/database/tables/{table_id}/duplicate/async/` |  | ⏭️ | ⏭️ | `createTable? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/tables/{table_id}/import/async/` |  | ⏭️ | ⏭️ | `createTable? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/tables/all-tables/` |  | ⏭️ | ⏭️ | `listTableRoleAssignments? (baserow.ts)` |
| 🟢 | `GET` | `/api/database/tables/database/{database_id}/` |  | ⏭️ | ⏭️ | `listDatabaseTables (baserow.ts)` |
| 🟢 | `POST` | `/api/database/tables/database/{database_id}/` |  | ⏭️ | ⏭️ | `createTable (baserow.ts)` |
| 🟡 | `POST` | `/api/database/tables/database/{database_id}/async/` |  | ⏭️ | ⏭️ | `triggerDataSyncAsync? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/tables/database/{database_id}/order/` |  | ⏭️ | ⏭️ | `createTableRoleAssignment? (baserow.ts)` |

### Database table export
`█████░░░░░` 50% — **1** exact · **1** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/export/{job_id}/` |  | ⏭️ | ⏭️ | `getDatabaseExportJob (baserow.ts)` |
| 🟡 | `POST` | `/api/database/export/table/{table_id}/` |  | ⏭️ | ⏭️ | `createTableRoleAssignment? (baserow.ts)` |

### Field rules
`██████░░░░` 60% — **3** exact · **2** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/field-rules/{table_id}/` |  | ⏭️ | ⏭️ | `listFieldRules (baserow.ts)` |
| 🟢 | `POST` | `/api/database/field-rules/{table_id}/` |  | ⏭️ | ⏭️ | `createFieldRule (baserow.ts)` |
| 🟡 | `GET` | `/api/database/field-rules/{table_id}/invalid-rows/` |  | ⏭️ | ⏭️ | `listDatabaseTables? (baserow.ts)` |
| 🟢 | `PUT` | `/api/database/field-rules/{table_id}/rule/{rule_id}/` |  | ⏭️ | ⏭️ | `updateFieldRule (baserow.ts)` |
| 🟡 | `DELETE` | `/api/database/field-rules/{table_id}/rule/{rule_id}/` |  | ⏭️ | ⏭️ | `updateFieldRule? (baserow.ts)` |

### Database table fields
`███░░░░░░░` 33% — **4** exact · **7** fuzzy · **1** missing of 12

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/database/fields/{field_id}/` |  | ⏭️ | ⏭️ | `updateField? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/fields/{field_id}/` |  | ⏭️ | ⏭️ | `updateField (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/fields/{field_id}/` |  | ⏭️ | ⏭️ | `deleteField (baserow.ts)` |
| 🟡 | `POST` | `/api/database/fields/{field_id}/duplicate/async/` |  | ⏭️ | ⏭️ | `createField? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/fields/{field_id}/generate-ai-field-values/` |  | ⏭️ | ⏭️ | `createField? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/fields/{field_id}/unique_row_values/` |  | ⏭️ | ⏭️ | `listFields? (baserow.ts)` |
| 🔴 | `POST` | `/api/database/fields/password-authentication/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `GET` | `/api/database/fields/table/{table_id}/` |  | ⏭️ | ⏭️ | `listFields (baserow.ts)` |
| 🟢 | `POST` | `/api/database/fields/table/{table_id}/` |  | ⏭️ | ⏭️ | `createField (baserow.ts)` |
| 🟡 | `POST` | `/api/database/fields/table/{table_id}/change-primary-field/` |  | ⏭️ | ⏭️ | `createField? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/fields/table/{table_id}/generate-ai-formula/` |  | ⏭️ | ⏭️ | `createField? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/formula/{table_id}/type/` |  | ⏭️ | ⏭️ | `createTable? (baserow.ts)` |

### Database table rows
`████████░░` 76% — **13** exact · **3** fuzzy · **1** missing of 17

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🔴 | `GET` | `/api/database/rows/names/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `GET` | `/api/database/rows/table/{table_id}/` |  | ⏭️ | ⏭️ | `listRows (baserow.ts)` |
| 🟢 | `POST` | `/api/database/rows/table/{table_id}/` |  | ⏭️ | ⏭️ | `createRow (baserow.ts)` |
| 🟢 | `GET` | `/api/database/rows/table/{table_id}/{row_id}/` |  | ⏭️ | ⏭️ | `getRow (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/rows/table/{table_id}/{row_id}/` |  | ⏭️ | ⏭️ | `updateRow (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/rows/table/{table_id}/{row_id}/` |  | ⏭️ | ⏭️ | `deleteRow (baserow.ts)` |
| 🟡 | `GET` | `/api/database/rows/table/{table_id}/{row_id}/adjacent/` |  | ⏭️ | ⏭️ | `getRow? (baserow.ts)` |
| 🟢 | `GET` | `/api/database/rows/table/{table_id}/{row_id}/history/` |  | ⏭️ | ⏭️ | `listRowHistory (baserow.ts)` |
| 🟡 | `PATCH` | `/api/database/rows/table/{table_id}/{row_id}/move/` |  | ⏭️ | ⏭️ | `updateRow? (baserow.ts)` |
| 🟢 | `POST` | `/api/database/rows/table/{table_id}/batch/` |  | ⏭️ | ⏭️ | `createRowsBatch (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/rows/table/{table_id}/batch/` |  | ⏭️ | ⏭️ | `updateRowsBatch (baserow.ts)` |
| 🟢 | `POST` | `/api/database/rows/table/{table_id}/batch-delete/` |  | ⏭️ | ⏭️ | `deleteRowsBatch (baserow.ts)` |
| 🟡 | `GET` | `/api/row_comments/{table_id}/{row_id}/` |  | ⏭️ | ⏭️ | `createComment? (baserow.ts)` |
| 🟢 | `POST` | `/api/row_comments/{table_id}/{row_id}/` |  | ⏭️ | ⏭️ | `createComment (baserow.ts)` |
| 🟢 | `PUT` | `/api/row_comments/{table_id}/{row_id}/notification-mode/` |  | ⏭️ | ⏭️ | `setRowCommentNotificationMode (baserow.ts)` |
| 🟢 | `PATCH` | `/api/row_comments/{table_id}/comment/{comment_id}/` |  | ⏭️ | ⏭️ | `updateComment (baserow.ts)` |
| 🟢 | `DELETE` | `/api/row_comments/{table_id}/comment/{comment_id}/` |  | ⏭️ | ⏭️ | `deleteComment (baserow.ts)` |

### Database tokens
`████████░░` 83% — **5** exact · **1** fuzzy · **0** missing of 6

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/tokens/` |  | ⏭️ | ⏭️ | `listDatabaseTokens (baserow.ts)` |
| 🟢 | `POST` | `/api/database/tokens/` |  | ⏭️ | ⏭️ | `createDatabaseToken (baserow.ts)` |
| 🟢 | `GET` | `/api/database/tokens/{token_id}/` |  | ⏭️ | ⏭️ | `getDatabaseToken (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/tokens/{token_id}/` |  | ⏭️ | ⏭️ | `updateDatabaseToken (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/tokens/{token_id}/` |  | ⏭️ | ⏭️ | `deleteDatabaseToken (baserow.ts)` |
| 🟡 | `GET` | `/api/database/tokens/check/` |  | ⏭️ | ⏭️ | `getDatabaseToken? (baserow.ts)` |

### Database table view export
`░░░░░░░░░░` 0% — **0** exact · **2** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `POST` | `/api/database/view/{slug}/export-public-view/` |  | ⏭️ | ⏭️ | `createTable? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/view/get-public-view-export/{job_id}/` |  | ⏭️ | ⏭️ | `listTableRoleAssignments? (baserow.ts)` |

### Database table views
`█████░░░░░` 50% — **9** exact · **9** fuzzy · **0** missing of 18

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `PATCH` | `/api/database/view/{view_id}/premium` |  | ⏭️ | ⏭️ | `updatePublicViewPremium (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/{slug}/link-row-field-lookup/{field_id}/` |  | ⏭️ | ⏭️ | `getFormViewForSubmit? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/{slug}/public/auth/` |  | ⏭️ | ⏭️ | `orderViews? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/{slug}/public/info/` |  | ⏭️ | ⏭️ | `listViews? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/{slug}/row/{row_id}/` |  | ⏭️ | ⏭️ | `getFormViewForSubmit? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/{view_id}/` |  | ⏭️ | ⏭️ | `updateView? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/views/{view_id}/` |  | ⏭️ | ⏭️ | `updateView (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/views/{view_id}/` |  | ⏭️ | ⏭️ | `deleteView (baserow.ts)` |
| 🟡 | `PATCH` | `/api/database/views/{view_id}/default-values/` |  | ⏭️ | ⏭️ | `updateViewFilter? (baserow.ts)` |
| 🟢 | `POST` | `/api/database/views/{view_id}/duplicate/` |  | ⏭️ | ⏭️ | `duplicateView (baserow.ts)` |
| 🟢 | `GET` | `/api/database/views/{view_id}/field-options/` |  | ⏭️ | ⏭️ | `getViewFieldOptions (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/views/{view_id}/field-options/` |  | ⏭️ | ⏭️ | `updateViewFieldOptions (baserow.ts)` |
| 🟢 | `POST` | `/api/database/views/{view_id}/rotate-slug/` |  | ⏭️ | ⏭️ | `rotateViewSlug (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/calendar/{ical_slug}.ics` |  | ⏭️ | ⏭️ | `listViews? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/calendar/{view_id}/ical_slug_rotate/` |  | ⏭️ | ⏭️ | `createViewGrouping? (baserow.ts)` |
| 🟢 | `GET` | `/api/database/views/table/{table_id}/` |  | ⏭️ | ⏭️ | `listViews (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/table/{table_id}/` |  | ⏭️ | ⏭️ | `listViews? (baserow.ts)` |
| 🟢 | `POST` | `/api/database/views/table/{table_id}/order/` |  | ⏭️ | ⏭️ | `orderViews (baserow.ts)` |

### Database table view decorations
`████░░░░░░` 40% — **2** exact · **3** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/views/{view_id}/decorations/` |  | ⏭️ | ⏭️ | `listViewDecorations (baserow.ts)` |
| 🟢 | `POST` | `/api/database/views/{view_id}/decorations/` |  | ⏭️ | ⏭️ | `createViewDecoration (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/decoration/{view_decoration_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |
| 🟡 | `PATCH` | `/api/database/views/decoration/{view_decoration_id}/` |  | ⏭️ | ⏭️ | `updateViewFieldOptions? (baserow.ts)` |
| 🟡 | `DELETE` | `/api/database/views/decoration/{view_decoration_id}/` |  | ⏭️ | ⏭️ | `deleteView? (baserow.ts)` |

### Database table view filters
`████░░░░░░` 44% — **4** exact · **5** fuzzy · **0** missing of 9

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `POST` | `/api/database/views/{view_id}/filter-groups/` |  | ⏭️ | ⏭️ | `createFilterGroup (baserow.ts)` |
| 🟢 | `GET` | `/api/database/views/{view_id}/filters/` |  | ⏭️ | ⏭️ | `listViewFilters (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/{view_id}/filters/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/filter-group/{view_filter_group_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |
| 🟡 | `PATCH` | `/api/database/views/filter-group/{view_filter_group_id}/` |  | ⏭️ | ⏭️ | `updateViewFieldOptions? (baserow.ts)` |
| 🟡 | `DELETE` | `/api/database/views/filter-group/{view_filter_group_id}/` |  | ⏭️ | ⏭️ | `deleteView? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/filter/{view_filter_id}/` |  | ⏭️ | ⏭️ | `updateViewFilter? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/views/filter/{view_filter_id}/` |  | ⏭️ | ⏭️ | `updateViewFilter (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/views/filter/{view_filter_id}/` |  | ⏭️ | ⏭️ | `deleteViewFilter (baserow.ts)` |

### Database table view groupings
`████████░░` 80% — **4** exact · **1** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/views/{view_id}/group_bys/` |  | ⏭️ | ⏭️ | `listViewGroupings (baserow.ts)` |
| 🟢 | `POST` | `/api/database/views/{view_id}/group_bys/` |  | ⏭️ | ⏭️ | `createViewGrouping (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/group_by/{view_group_by_id}/` |  | ⏭️ | ⏭️ | `updateViewGrouping? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/views/group_by/{view_group_by_id}/` |  | ⏭️ | ⏭️ | `updateViewGrouping (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/views/group_by/{view_group_by_id}/` |  | ⏭️ | ⏭️ | `deleteViewGrouping (baserow.ts)` |

### Database table view sortings
`██████░░░░` 60% — **3** exact · **2** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/views/{view_id}/sortings/` |  | ⏭️ | ⏭️ | `listViewSortings (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/{view_id}/sortings/` |  | ⏭️ | ⏭️ | `listViewSortings? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/sort/{view_sort_id}/` |  | ⏭️ | ⏭️ | `updateViewSort? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/views/sort/{view_sort_id}/` |  | ⏭️ | ⏭️ | `updateViewSort (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/views/sort/{view_sort_id}/` |  | ⏭️ | ⏭️ | `deleteViewSort (baserow.ts)` |

### Database table calendar view
`░░░░░░░░░░` 0% — **0** exact · **2** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/database/views/calendar/{slug}/public/rows/` |  | ⏭️ | ⏭️ | `getPublicGridViewRows? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/calendar/{view_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |

### Database table form view
`████████░░` 80% — **4** exact · **1** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/views/form/{slug}/edit-row/{row_token}/` |  | ⏭️ | ⏭️ | `getFormViewEditRow (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/views/form/{slug}/edit-row/{row_token}/` |  | ⏭️ | ⏭️ | `updateFormViewEditRow (baserow.ts)` |
| 🟢 | `GET` | `/api/database/views/form/{slug}/submit/` |  | ⏭️ | ⏭️ | `getFormViewForSubmit (baserow.ts)` |
| 🟢 | `POST` | `/api/database/views/form/{slug}/submit/` |  | ⏭️ | ⏭️ | `submitFormView (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/form/{slug}/upload-file/` |  | ⏭️ | ⏭️ | `createViewGrouping? (baserow.ts)` |

### Database table gallery view
`░░░░░░░░░░` 0% — **0** exact · **2** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/database/views/gallery/{slug}/public/rows/` |  | ⏭️ | ⏭️ | `getPublicGridViewRows? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/gallery/{view_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |

### Database table grid view
`███░░░░░░░` 33% — **2** exact · **4** fuzzy · **0** missing of 6

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/database/views/grid/{slug}/public/aggregations/` |  | ⏭️ | ⏭️ | `getPublicGridViewAggregations (baserow.ts)` |
| 🟢 | `GET` | `/api/database/views/grid/{slug}/public/rows/` |  | ⏭️ | ⏭️ | `getPublicGridViewRows (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/grid/{view_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |
| 🟡 | `POST` | `/api/database/views/grid/{view_id}/` |  | ⏭️ | ⏭️ | `createViewGrouping? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/grid/{view_id}/aggregation/{field_id}/` |  | ⏭️ | ⏭️ | `getPublicGridViewRows? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/grid/{view_id}/aggregations/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |

### Database table kanban view
`░░░░░░░░░░` 0% — **0** exact · **2** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/database/views/kanban/{slug}/public/rows/` |  | ⏭️ | ⏭️ | `getPublicGridViewRows? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/kanban/{view_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |

### Database table timeline view
`░░░░░░░░░░` 0% — **0** exact · **2** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/database/views/timeline/{slug}/public/rows/` |  | ⏭️ | ⏭️ | `getPublicGridViewRows? (baserow.ts)` |
| 🟡 | `GET` | `/api/database/views/timeline/{view_id}/` |  | ⏭️ | ⏭️ | `listViewFilters? (baserow.ts)` |

### Database table webhooks
`████████░░` 83% — **5** exact · **1** fuzzy · **0** missing of 6

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/database/webhooks/{webhook_id}/` |  | ⏭️ | ⏭️ | `updateTableWebhook? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/database/webhooks/{webhook_id}/` |  | ⏭️ | ⏭️ | `updateTableWebhook (baserow.ts)` |
| 🟢 | `DELETE` | `/api/database/webhooks/{webhook_id}/` |  | ⏭️ | ⏭️ | `deleteTableWebhook (baserow.ts)` |
| 🟢 | `GET` | `/api/database/webhooks/table/{table_id}/` |  | ⏭️ | ⏭️ | `listTableWebhooks (baserow.ts)` |
| 🟢 | `POST` | `/api/database/webhooks/table/{table_id}/` |  | ⏭️ | ⏭️ | `createTableWebhook (baserow.ts)` |
| 🟢 | `POST` | `/api/database/webhooks/table/{table_id}/test-call/` |  | ⏭️ | ⏭️ | `testTableWebhook (baserow.ts)` |

### Field permissions
`██████████` 100% — **2** exact · **0** fuzzy · **0** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/field-permissions/{field_id}/` |  | ⏭️ | ⏭️ | `getFieldPermissions (baserow.ts)` |
| 🟢 | `PATCH` | `/api/field-permissions/{field_id}/` |  | ⏭️ | ⏭️ | `updateFieldPermissions (baserow.ts)` |

### Secure file serve
`░░░░░░░░░░` 0% — **0** exact · **0** fuzzy · **1** missing of 1

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🔴 | `GET` | `/api/files/{signed_data}` |  | ⏭️ | ⏭️ | — |

### Jobs
`██████████` 100% — **4** exact · **0** fuzzy · **0** missing of 4

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/jobs/` |  | ⏭️ | ⏭️ | `listJobs (baserow.ts)` |
| 🟢 | `POST` | `/api/jobs/` |  | ⏭️ | ⏭️ | `createJob (baserow.ts)` |
| 🟢 | `GET` | `/api/jobs/{job_id}/` |  | ⏭️ | ⏭️ | `getJob (baserow.ts)` |
| 🟢 | `POST` | `/api/jobs/{job_id}/cancel/` |  | ⏭️ | ⏭️ | `cancelJob (baserow.ts)` |

### MCP endpoints
`██████████` 100% — **5** exact · **0** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/mcp/endpoint/{endpoint_id}/` |  | ⏭️ | ⏭️ | `getMcpEndpoint (baserow.ts)` |
| 🟢 | `PATCH` | `/api/mcp/endpoint/{endpoint_id}/` |  | ⏭️ | ⏭️ | `updateMcpEndpoint (baserow.ts)` |
| 🟢 | `DELETE` | `/api/mcp/endpoint/{endpoint_id}/` |  | ⏭️ | ⏭️ | `deleteMcpEndpoint (baserow.ts)` |
| 🟢 | `GET` | `/api/mcp/endpoints/` |  | ⏭️ | ⏭️ | `listMcpEndpoints (baserow.ts)` |
| 🟢 | `POST` | `/api/mcp/endpoints/` |  | ⏭️ | ⏭️ | `createMcpEndpoint (baserow.ts)` |

### Notifications
`████████░░` 75% — **3** exact · **1** fuzzy · **0** missing of 4

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/notifications/{workspace_id}/` |  | ⏭️ | ⏭️ | `clearWorkspaceNotifications? (baserow.ts)` |
| 🟢 | `DELETE` | `/api/notifications/{workspace_id}/` |  | ⏭️ | ⏭️ | `clearWorkspaceNotifications (baserow.ts)` |
| 🟢 | `PATCH` | `/api/notifications/{workspace_id}/{notification_id}/` |  | ⏭️ | ⏭️ | `markNotificationRead (baserow.ts)` |
| 🟢 | `POST` | `/api/notifications/{workspace_id}/mark-all-as-read/` |  | ⏭️ | ⏭️ | `markAllNotificationsRead (baserow.ts)` |

### Role assignments
`██████████` 100% — **3** exact · **0** fuzzy · **0** missing of 3

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/role/{workspace_id}/` |  | ⏭️ | ⏭️ | `listRoleAssignments (baserow.ts)` |
| 🟢 | `POST` | `/api/role/{workspace_id}/` |  | ⏭️ | ⏭️ | `assignRole (baserow.ts)` |
| 🟢 | `POST` | `/api/role/{workspace_id}/batch/` |  | ⏭️ | ⏭️ | `batchAssignRoles (baserow.ts)` |

### Search
`██████████` 100% — **1** exact · **0** fuzzy · **0** missing of 1

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/search/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `searchWorkspace (baserow.ts)` |

### Settings
`██████████` 100% — **3** exact · **0** fuzzy · **0** missing of 3

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/settings/` |  | ⏭️ | ⏭️ | `getSettings (baserow.ts)` |
| 🟢 | `GET` | `/api/settings/instance-id/` |  | ⏭️ | ⏭️ | `getInstanceId (baserow.ts)` |
| 🟢 | `PATCH` | `/api/settings/update/` |  | ⏭️ | ⏭️ | `updateSettings (baserow.ts)` |

### Snapshots
`██████████` 100% — **4** exact · **0** fuzzy · **0** missing of 4

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `DELETE` | `/api/snapshots/{snapshot_id}/` |  | ⏭️ | ⏭️ | `deleteSnapshot (baserow.ts)` |
| 🟢 | `POST` | `/api/snapshots/{snapshot_id}/restore/` |  | ⏭️ | ⏭️ | `restoreSnapshot (baserow.ts)` |
| 🟢 | `GET` | `/api/snapshots/application/{application_id}/` |  | ⏭️ | ⏭️ | `listApplicationSnapshots (baserow.ts)` |
| 🟢 | `POST` | `/api/snapshots/application/{application_id}/` |  | ⏭️ | ⏭️ | `createApplicationSnapshot (baserow.ts)` |

### Teams
`████░░░░░░` 44% — **4** exact · **5** fuzzy · **0** missing of 9

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟡 | `GET` | `/api/teams/{team_id}/` |  | ⏭️ | ⏭️ | `updateTeam? (baserow.ts)` |
| 🟡 | `PUT` | `/api/teams/{team_id}/` |  | ⏭️ | ⏭️ | `updateTeam? (baserow.ts)` |
| 🟢 | `DELETE` | `/api/teams/{team_id}/` |  | ⏭️ | ⏭️ | `deleteTeam (baserow.ts)` |
| 🟡 | `GET` | `/api/teams/{team_id}/subjects/` |  | ⏭️ | ⏭️ | `listTeams? (baserow.ts)` |
| 🟡 | `POST` | `/api/teams/{team_id}/subjects/` |  | ⏭️ | ⏭️ | `createTeam? (baserow.ts)` |
| 🟡 | `GET` | `/api/teams/{team_id}/subjects/{subject_id}/` |  | ⏭️ | ⏭️ | `removeTeamSubject? (baserow.ts)` |
| 🟢 | `DELETE` | `/api/teams/{team_id}/subjects/{subject_id}/` |  | ⏭️ | ⏭️ | `removeTeamSubject (baserow.ts)` |
| 🟢 | `GET` | `/api/teams/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `listTeams (baserow.ts)` |
| 🟢 | `POST` | `/api/teams/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `createTeam (baserow.ts)` |

### Templates
`███████░░░` 67% — **2** exact · **1** fuzzy · **0** missing of 3

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/templates/` |  | ⏭️ | ⏭️ | `listTemplates (baserow.ts)` |
| 🟡 | `POST` | `/api/templates/install/{workspace_id}/{template_id}/` |  | ⏭️ | ⏭️ | `installTemplateAsync? (baserow.ts)` |
| 🟢 | `POST` | `/api/templates/install/{workspace_id}/{template_id}/async/` |  | ⏭️ | ⏭️ | `installTemplateAsync (baserow.ts)` |

### Trash
`██████████` 100% — **4** exact · **0** fuzzy · **0** missing of 4

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/trash/` |  | ⏭️ | ⏭️ | `listGlobalTrash (baserow.ts)` |
| 🟢 | `PATCH` | `/api/trash/restore/` |  | ⏭️ | ⏭️ | `restoreTrashItem (baserow.ts)` |
| 🟢 | `GET` | `/api/trash/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `listWorkspaceTrash (baserow.ts)` |
| 🟢 | `DELETE` | `/api/trash/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `emptyWorkspaceTrash (baserow.ts)` |

### User
`██████████` 100% — **17** exact · **0** fuzzy · **0** missing of 17

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `POST` | `/api/user/` |  | ⏭️ | ⏭️ | `registerUser (baserow.ts)` |
| 🟢 | `PATCH` | `/api/user/account/` |  | ⏭️ | ⏭️ | `updateUserAccount (baserow.ts)` |
| 🟢 | `POST` | `/api/user/change-email/` |  | ⏭️ | ⏭️ | `requestEmailChange (baserow.ts)` |
| 🟢 | `POST` | `/api/user/change-password/` |  | ⏭️ | ⏭️ | `changePassword (baserow.ts)` |
| 🟢 | `GET` | `/api/user/dashboard/` |  | ⏭️ | ⏭️ | `getUserDashboard (baserow.ts)` |
| 🟢 | `PATCH` | `/api/user/redo/` |  | ⏭️ | ⏭️ | `redoAction (baserow.ts)` |
| 🟢 | `POST` | `/api/user/reset-password/` |  | ⏭️ | ⏭️ | `resetPassword (baserow.ts)` |
| 🟢 | `POST` | `/api/user/schedule-account-deletion/` |  | ⏭️ | ⏭️ | `scheduleAccountDeletion (baserow.ts)` |
| 🟢 | `POST` | `/api/user/send-change-email-confirmation/` |  | ⏭️ | ⏭️ | `sendChangeEmailConfirmation (baserow.ts)` |
| 🟢 | `POST` | `/api/user/send-reset-password-email/` |  | ⏭️ | ⏭️ | `sendResetPasswordEmail (baserow.ts)` |
| 🟢 | `POST` | `/api/user/send-verify-email/` |  | ⏭️ | ⏭️ | `sendVerificationEmail (baserow.ts)` |
| 🟢 | `POST` | `/api/user/token-auth/` |  | ⏭️ | ⏭️ | `login (baserow.ts)` |
| 🟢 | `POST` | `/api/user/token-blacklist/` |  | ⏭️ | ⏭️ | `blacklistToken (baserow.ts)` |
| 🟢 | `POST` | `/api/user/token-refresh/` |  | ⏭️ | ⏭️ | `refreshAuth (baserow.ts)` |
| 🟢 | `POST` | `/api/user/token-verify/` |  | ⏭️ | ⏭️ | `verifyToken (baserow.ts)` |
| 🟢 | `PATCH` | `/api/user/undo/` |  | ⏭️ | ⏭️ | `undoAction (baserow.ts)` |
| 🟢 | `POST` | `/api/user/verify-email/` |  | ⏭️ | ⏭️ | `verifyEmail (baserow.ts)` |

### User files
`█████░░░░░` 50% — **1** exact · **0** fuzzy · **1** missing of 2

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🔴 | `POST` | `/api/user-files/upload-file/` |  | ⏭️ | ⏭️ | — |
| 🟢 | `POST` | `/api/user-files/upload-via-url/` |  | ⏭️ | ⏭️ | `uploadFileViaUrl (baserow.ts)` |

### Core webhooks
`██████░░░░` 60% — **3** exact · **2** fuzzy · **0** missing of 5

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/webhooks/{webhook_uid}/` |  | ⏭️ | ⏭️ | `getCoreWebhook (baserow.ts)` |
| 🟡 | `POST` | `/api/webhooks/{webhook_uid}/` |  | ⏭️ | ⏭️ | `getCoreWebhook? (baserow.ts)` |
| 🟡 | `PUT` | `/api/webhooks/{webhook_uid}/` |  | ⏭️ | ⏭️ | `getCoreWebhook? (baserow.ts)` |
| 🟢 | `PATCH` | `/api/webhooks/{webhook_uid}/` |  | ⏭️ | ⏭️ | `updateCoreWebhook (baserow.ts)` |
| 🟢 | `DELETE` | `/api/webhooks/{webhook_uid}/` |  | ⏭️ | ⏭️ | `deleteCoreWebhook (baserow.ts)` |

### Workspaces
`███████░░░` 67% — **12** exact · **6** fuzzy · **0** missing of 18

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/workspaces/` |  | ⏭️ | ⏭️ | `listWorkspaces (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/` |  | ⏭️ | ⏭️ | `createWorkspace (baserow.ts)` |
| 🟢 | `PATCH` | `/api/workspaces/{workspace_id}/` |  | ⏭️ | ⏭️ | `updateWorkspace (baserow.ts)` |
| 🟢 | `DELETE` | `/api/workspaces/{workspace_id}/` |  | ⏭️ | ⏭️ | `deleteWorkspace (baserow.ts)` |
| 🟡 | `GET` | `/api/workspaces/{workspace_id}/export/` |  | ⏭️ | ⏭️ | `getWorkspaceInvitation? (baserow.ts)` |
| 🟡 | `POST` | `/api/workspaces/{workspace_id}/export/async/` |  | ⏭️ | ⏭️ | `importApplicationsAsync? (baserow.ts)` |
| 🟡 | `DELETE` | `/api/workspaces/{workspace_id}/import/{resource_id}/` |  | ⏭️ | ⏭️ | `removeWorkspaceMember? (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/{workspace_id}/import/async/` |  | ⏭️ | ⏭️ | `importApplicationsAsync (baserow.ts)` |
| 🟡 | `POST` | `/api/workspaces/{workspace_id}/import/upload-file/` |  | ⏭️ | ⏭️ | `importApplicationsAsync? (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/{workspace_id}/leave/` |  | ⏭️ | ⏭️ | `leaveWorkspace (baserow.ts)` |
| 🟢 | `GET` | `/api/workspaces/{workspace_id}/permissions/` |  | ⏭️ | ⏭️ | `getWorkspacePermissions (baserow.ts)` |
| 🟡 | `GET` | `/api/workspaces/{workspace_id}/settings/generative-ai/` |  | ⏭️ | ⏭️ | `listComments? (baserow.ts)` |
| 🟡 | `PATCH` | `/api/workspaces/{workspace_id}/settings/generative-ai/` |  | ⏭️ | ⏭️ | `updateWorkspaceMember? (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/create-initial-workspace/` |  | ⏭️ | ⏭️ | `createInitialWorkspace (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/order/` |  | ⏭️ | ⏭️ | `orderWorkspaces (baserow.ts)` |
| 🟢 | `PATCH` | `/api/workspaces/users/{workspace_user_id}/` |  | ⏭️ | ⏭️ | `updateWorkspaceMember (baserow.ts)` |
| 🟢 | `DELETE` | `/api/workspaces/users/{workspace_user_id}/` |  | ⏭️ | ⏭️ | `removeWorkspaceMember (baserow.ts)` |
| 🟢 | `GET` | `/api/workspaces/users/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `listWorkspaceMembers (baserow.ts)` |

### Workspace invitations
`██████████` 100% — **8** exact · **0** fuzzy · **0** missing of 8

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/api/workspaces/invitations/{workspace_invitation_id}/` |  | ⏭️ | ⏭️ | `getWorkspaceInvitation (baserow.ts)` |
| 🟢 | `PATCH` | `/api/workspaces/invitations/{workspace_invitation_id}/` |  | ⏭️ | ⏭️ | `updateWorkspaceInvitation (baserow.ts)` |
| 🟢 | `DELETE` | `/api/workspaces/invitations/{workspace_invitation_id}/` |  | ⏭️ | ⏭️ | `deleteWorkspaceInvitation (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/invitations/{workspace_invitation_id}/accept/` |  | ⏭️ | ⏭️ | `acceptWorkspaceInvitation (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/invitations/{workspace_invitation_id}/reject/` |  | ⏭️ | ⏭️ | `rejectWorkspaceInvitation (baserow.ts)` |
| 🟢 | `GET` | `/api/workspaces/invitations/token/{token}/` |  | ⏭️ | ⏭️ | `getWorkspaceInvitationByToken (baserow.ts)` |
| 🟢 | `GET` | `/api/workspaces/invitations/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `listWorkspaceInvitations (baserow.ts)` |
| 🟢 | `POST` | `/api/workspaces/invitations/workspace/{workspace_id}/` |  | ⏭️ | ⏭️ | `createWorkspaceInvitation (baserow.ts)` |

### AI Assistant
`█████████░` 88% — **7** exact · **1** fuzzy · **0** missing of 8

| | Method | Path | Summary | App | API | Function |
|--|--------|------|---------|-----|-----|----------|
| 🟢 | `GET` | `/assistant/chat/` |  | ⏭️ | ⏭️ | `listAssistantChats (baserow.ts)` |
| 🟡 | `GET` | `/assistant/chat/{chat_uuid}/cancel/` |  | ⏭️ | ⏭️ | `cancelAssistantSession? (baserow.ts)` |
| 🟢 | `POST` | `/assistant/chat/{chat_uuid}/cancel/` |  | ⏭️ | ⏭️ | `cancelAssistantSessionPost (baserow.ts)` |
| 🟢 | `DELETE` | `/assistant/chat/{chat_uuid}/cancel/` |  | ⏭️ | ⏭️ | `cancelAssistantSession (baserow.ts)` |
| 🟢 | `GET` | `/assistant/chat/{chat_uuid}/messages/` |  | ⏭️ | ⏭️ | `listAssistantMessages (baserow.ts)` |
| 🟢 | `POST` | `/assistant/chat/{chat_uuid}/messages/` |  | ⏭️ | ⏭️ | `sendAssistantMessage (baserow.ts)` |
| 🟢 | `DELETE` | `/assistant/chat/{chat_uuid}/messages/` |  | ⏭️ | ⏭️ | `cancelAssistantMessage (baserow.ts)` |
| 🟢 | `PUT` | `/assistant/messages/{message_id}/feedback/` |  | ⏭️ | ⏭️ | `submitAssistantFeedback (baserow.ts)` |
