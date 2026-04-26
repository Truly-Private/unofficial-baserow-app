# Baserow Mobile Parity Plan — Dashboards, Automations, and Applications

## Current Baseline

Branch: `feat/ai-chatbot`

Latest `origin/main` was pulled into the current branch before writing this plan.

The mobile app already has strong parity for the database/table path:

- Workspaces and applications list
- Database/app creation
- Template install and import flows
- Table creation
- Table browsing
- Row create/edit/delete
- Field-aware row editing
- Column/field management work in progress
- Saved views, search, sorting, pagination, bulk delete, realtime invalidation
- AI assistant entry points for workspace/app/table creation

This plan extends the same parity approach to the remaining Baserow application types:

- `dashboard`
- `automation`
- `builder` / Application Builder

## Sources Checked

- Official Baserow backend API docs: https://baserow.io/docs/apis/rest-api
- Official OpenAPI schema: https://api.baserow.io/api/schema.json
- Application Builder data-source user docs: https://baserow.io/user-docs/data-sources

## Product Goal

Make the mobile app useful for all Baserow workspace assets, not just databases and tables.

Users should be able to:

1. See every application type from a workspace.
2. Open dashboards, automations, and application-builder apps from mobile.
3. Inspect their structure and status.
4. Perform safe common edits.
5. Run/dispatch/test supported actions where Baserow exposes APIs.
6. Use AI assistant contextually inside each asset type.

## API Surface Map

### Shared Applications

```http
GET    /api/applications/
GET    /api/applications/workspace/{workspace_id}/
POST   /api/applications/workspace/{workspace_id}/
GET    /api/applications/{application_id}/
PATCH  /api/applications/{application_id}/
DELETE /api/applications/{application_id}/
POST   /api/applications/{application_id}/duplicate/async/
POST   /api/applications/workspace/{workspace_id}/order/
GET    /api/snapshots/application/{application_id}/
POST   /api/snapshots/application/{application_id}/
```

Mobile parity target:

- Create database/dashboard/automation/builder app types.
- Rename apps.
- Delete apps with confirmation.
- Duplicate apps and track async jobs.
- Reorder apps inside a workspace.
- Show snapshots and allow snapshot creation if supported by permissions.

### Dashboards

```http
GET   /api/dashboard/{dashboard_id}/widgets/
POST  /api/dashboard/{dashboard_id}/widgets/
PATCH /api/dashboard/widgets/{widget_id}/
DELETE /api/dashboard/widgets/{widget_id}/

GET   /api/dashboard/{dashboard_id}/data-sources/
PATCH /api/dashboard/data-sources/{data_source_id}/
POST  /api/dashboard/data-sources/{data_source_id}/dispatch/
```

Mobile parity target:

- Open dashboard apps from workspace.
- List widgets.
- Render core widget types as native mobile cards/charts where feasible.
- List dashboard data sources.
- Dispatch data sources to populate KPI cards/charts.
- Edit basic widget settings: title, layout metadata, data source binding.
- Delete widgets with confirmation.
- Create simple widgets once widget type payloads are verified.

### Automations

```http
POST   /api/automation/{automation_id}/workflows/
POST   /api/automation/{automation_id}/workflows/order/
GET    /api/automation/workflows/{workflow_id}/
PATCH  /api/automation/workflows/{workflow_id}/
DELETE /api/automation/workflows/{workflow_id}/
POST   /api/automation/workflows/{workflow_id}/duplicate/async/
GET    /api/automation/workflows/{workflow_id}/history/
POST   /api/automation/workflows/{workflow_id}/publish/async/
POST   /api/automation/workflows/{workflow_id}/test/

GET    /api/automation/workflow/{workflow_id}/nodes/
POST   /api/automation/workflow/{workflow_id}/nodes/
PATCH  /api/automation/node/{node_id}/
DELETE /api/automation/node/{node_id}/
POST   /api/automation/node/{node_id}/duplicate/
POST   /api/automation/node/{node_id}/replace/
POST   /api/automation/node/{node_id}/move/
POST   /api/automation/node/{node_id}/simulate-dispatch/
```

Mobile parity target:

- Open automation apps from workspace.
- List workflows.
- Create, rename, duplicate, delete, and reorder workflows.
- Show workflow detail with trigger/action nodes.
- Show workflow history/runs.
- Test workflow.
- Publish workflow and track async job status.
- Add/edit/delete nodes for supported node types.
- Simulate node dispatch for debugging.

### Application Builder / Builder Apps

```http
POST  /api/builder/{builder_id}/pages/
POST  /api/builder/{builder_id}/pages/order/
PATCH /api/builder/pages/{page_id}/
DELETE /api/builder/pages/{page_id}/
POST  /api/builder/pages/{page_id}/duplicate/async/

GET   /api/builder/page/{page_id}/elements/
POST  /api/builder/page/{page_id}/elements/
PATCH /api/builder/element/{element_id}/
DELETE /api/builder/element/{element_id}/
POST  /api/builder/element/{element_id}/duplicate/
PATCH /api/builder/element/{element_id}/move/

GET   /api/builder/page/{page_id}/data-sources/
POST  /api/builder/page/{page_id}/data-sources/
PATCH /api/builder/data-source/{data_source_id}/
DELETE /api/builder/data-source/{data_source_id}/
PATCH /api/builder/data-source/{data_source_id}/move/
POST  /api/builder/data-source/{data_source_id}/dispatch/
GET   /api/builder/data-source/{data_source_id}/record-names/

GET   /api/builder/page/{page_id}/workflow_actions/
POST  /api/builder/page/{page_id}/workflow_actions/
PATCH /api/builder/workflow_action/{workflow_action_id}/
DELETE /api/builder/workflow_action/{workflow_action_id}/
POST  /api/builder/workflow_action/{workflow_action_id}/dispatch/
POST  /api/builder/page/{page_id}/workflow_actions/order/

GET   /api/builder/{builder_id}/domains/
POST  /api/builder/{builder_id}/domains/
PATCH /api/builder/domains/{domain_id}/
DELETE /api/builder/domains/{domain_id}/
POST  /api/builder/domains/{domain_id}/publish/async/

PATCH /api/builder/{builder_id}/theme/
```

Mobile parity target:

- Open builder apps from workspace.
- List pages.
- Create, rename, duplicate, delete, and reorder pages.
- Inspect page elements.
- Render a mobile preview for common element types.
- Add/edit/delete simple elements after payloads are verified.
- List and dispatch data sources.
- Support data-source actions documented by Baserow: list rows, get row, summarize field.
- Manage workflow actions.
- Manage domains and publish domains.
- Edit high-level theme settings.

## Implementation Phases

### Phase 0 — Discovery and Test Fixtures

Deliverables:

- Add `docs/api-probes/` or `scripts/` probes for dashboard, automation, and builder endpoints.
- Use test credentials/workspace to capture real response shapes.
- Record minimum viable payloads for creating:
  - dashboard widget
  - automation workflow
  - automation node
  - builder page
  - builder element
  - builder data source
- Identify permission/premium/feature-flag failures and expected error bodies.

Acceptance criteria:

- We know which endpoints are enabled on Baserow Cloud test workspace.
- We have sample JSON fixtures for read/list/detail endpoints.
- Unknown payloads are documented before UI work starts.

### Phase 1 — Application Shell Parity

Deliverables:

- Extend `artifacts/mobile/lib/baserow.ts` types for non-database applications.
- Add app-type routing from the workspace home screen:
  - database -> existing database screen
  - dashboard -> dashboard screen
  - automation -> automation screen
  - builder -> builder app screen
- Add shared app actions:
  - rename
  - duplicate
  - delete
  - snapshot list/create
  - async job tracking
- Improve app cards with type-specific icons, labels, and status.

Acceptance criteria:

- Tapping every app type opens a useful native screen instead of dead-ending.
- Shared app actions work across supported application types.

### Phase 2 — Dashboard Mobile Parity

Deliverables:

- New route: `artifacts/mobile/app/(app)/dashboard/[id].tsx`
- API methods:
  - `listDashboardWidgets`
  - `createDashboardWidget`
  - `updateDashboardWidget`
  - `deleteDashboardWidget`
  - `listDashboardDataSources`
  - `updateDashboardDataSource`
  - `dispatchDashboardDataSource`
- UI:
  - dashboard overview
  - widget list
  - widget detail/editor
  - data-source inspector
  - refresh/dispatch button
- Rendering:
  - KPI/stat cards first
  - table/list widgets second
  - simple chart placeholders or native chart renderer after response shape is known

Acceptance criteria:

- User can open a dashboard and see its widgets.
- User can refresh data-source-backed widgets.
- User can safely edit/delete supported widgets.

### Phase 3 — Automation Mobile Parity

Deliverables:

- New route: `artifacts/mobile/app/(app)/automation/[id].tsx`
- New route: `artifacts/mobile/app/(app)/automation/workflow/[id].tsx`
- API methods:
  - `createAutomationWorkflow`
  - `orderAutomationWorkflows`
  - `getAutomationWorkflow`
  - `updateAutomationWorkflow`
  - `deleteAutomationWorkflow`
  - `duplicateAutomationWorkflowAsync`
  - `getAutomationWorkflowHistory`
  - `publishAutomationWorkflowAsync`
  - `testAutomationWorkflow`
  - `listAutomationNodes`
  - node create/update/delete/duplicate/replace/move/simulate methods
- UI:
  - workflow list
  - workflow detail
  - node list / simple vertical flow
  - node detail/editor for supported node types
  - run history
  - test/publish controls

Acceptance criteria:

- User can inspect workflows and nodes.
- User can test and publish workflows.
- User can view workflow history.
- Safe editing works for supported node types.

### Phase 4 — Application Builder Mobile Parity

Deliverables:

- New route: `artifacts/mobile/app/(app)/builder/[id].tsx`
- New route: `artifacts/mobile/app/(app)/builder/page/[id].tsx`
- API methods:
  - page create/update/delete/duplicate/order
  - element list/create/update/delete/duplicate/move
  - data-source list/create/update/delete/move/dispatch/record-names
  - workflow-action list/create/update/delete/order/dispatch
  - domain list/create/update/delete/order/publish
  - theme update
- UI:
  - page list
  - page preview/structure view
  - element inspector/editor
  - data-source inspector/dispatcher
  - workflow action list
  - domains and publishing screen
  - theme settings screen

Acceptance criteria:

- User can open a builder app and navigate pages.
- User can inspect page elements and data sources.
- User can dispatch data sources and workflow actions.
- User can publish domains where permissions allow.

### Phase 5 — AI Assistant Integration Across New App Types

Deliverables:

- Pass richer `ui_context` to the AI assistant:
  - workspace
  - application type/id/name
  - dashboard/widget context
  - automation/workflow/node context
  - builder/page/element/data-source context
- Add contextual quick prompts:
  - Dashboard: “summarize this dashboard”, “add KPI widget”, “refresh data”
  - Automation: “explain this workflow”, “test this workflow”, “add notification step”
  - Builder: “create a detail page”, “add a table element”, “connect this page to table data”
- Add confirmation previews before mutating dashboards, automations, or builder apps.

Acceptance criteria:

- AI actions understand which app/screen the user is viewing.
- Mutating AI actions require confirmation before API calls.

### Phase 6 — Polish, Offline, and Guardrails

Deliverables:

- Feature flags for beta surfaces.
- Permission-aware disabled states.
- Premium/feature-unavailable messaging.
- Optimistic UI only for safe reversible actions.
- Async job progress UI reused across duplicate/publish/template/import flows.
- Realtime invalidation where Baserow emits relevant events.
- Test coverage for API serialization and route-level smoke tests.

Acceptance criteria:

- Unsupported endpoints fail gracefully.
- Destructive actions require confirmation.
- TypeScript check passes.
- Manual QA checklist passes on mobile web and Expo.

## Suggested Build Order

1. **Application shell parity** — make all app types openable and manageable.
2. **Dashboard read/refresh parity** — dashboards are easiest to make valuable quickly.
3. **Automation read/test/history parity** — inspect and run before editing.
4. **Builder read/preview/data-source parity** — inspect pages/elements/data first.
5. **Safe editing for each surface** — after payloads are verified.
6. **AI contextual actions** — after deterministic API flows are stable.

## Manual QA Checklist

### Shared Application QA

- Create dashboard app.
- Create automation app.
- Create builder app.
- Rename each app type.
- Duplicate each app type and track job.
- Delete test apps with confirmation.

### Dashboard QA

- Open dashboard.
- Load widgets.
- Load data sources.
- Dispatch a data source.
- Edit supported widget metadata.
- Delete a test widget.

### Automation QA

- Open automation.
- Create workflow.
- Open workflow detail.
- List nodes.
- Test workflow.
- View history.
- Publish workflow and track job.
- Delete test workflow.

### Builder QA

- Open builder app.
- Create page.
- List page elements.
- Create simple element.
- List data sources.
- Dispatch data source.
- List workflow actions.
- Manage domain/publish where available.
- Delete test page.

## Risks and Unknowns

- Some dashboard, automation, and builder endpoints may require paid features or feature flags.
- Creation payloads vary by widget/node/element/data-source type and need fixture capture before implementation.
- Builder rendering parity can become large quickly; prioritize structure/read/dispatch before full visual editing.
- Automation node editing should start with a small supported subset to avoid invalid workflow graphs.
- Mobile UX should avoid drag-and-drop-heavy parity at first; use ordered lists and explicit move controls.

## Immediate Next Task

Start with **Phase 0: Discovery and Test Fixtures**.

Create endpoint probes for the current test workspace, capture real JSON response shapes, and identify which dashboard, automation, and builder features are enabled. Then implement **Phase 1: Application Shell Parity** so every Baserow app type has a native mobile destination.

## Execution Update — Mobile Endpoint Control Pass

Implemented a mobile-friendly endpoint control pass for the non-database app types:

- Added generic JSON action modal for advanced/desktop-parity endpoint payloads.
- Dashboard screen now exposes widget create/update/delete and data-source update/dispatch, including JSON payload dispatch.
- Automation list screen now exposes workflow create/update/delete/duplicate/order.
- Automation workflow screen now exposes node create/update/delete/duplicate/move/replace/simulate plus workflow test/publish/history.
- Builder app screen now exposes page create/update/delete/duplicate/order, domain create/update/delete/order/publish, theme updates, integrations create/update/delete/move, and user-source list/create/roles/users endpoints.
- Builder page screen now exposes element create/update/delete/duplicate/move, data-source create/update/delete/move/dispatch/record-names, workflow-action create/update/delete/order/dispatch, and page-wide data-source dispatch.

The UI uses compact mobile cards and pill actions for common actions, with JSON payload modals for advanced type-specific Baserow payloads that vary by widget/node/element/data-source/action type.

## Execution Update — Remaining Core Gaps

Additional endpoints wired since the previous update:

- User dashboard and admin dashboard inspection endpoints.
- Public builder domain availability check endpoint.

These surfaced as mobile actions on the dashboard and builder screens so the app can inspect more of Baserow's native API surface without leaving the phone.
