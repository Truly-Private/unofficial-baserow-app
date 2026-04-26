# Dashboard, Automation, and Application Parity Checklist

Track mobile parity for Baserow desktop app surfaces: Dashboard, Automation, and Application Builder.

## Current baseline

- [x] Workspace creation flow exists on mobile.
- [x] Add-new menu can create Database, Application, Dashboard, and Automation apps.
- [x] Created app cards route to native mobile screens by application type.
- [x] Mobile typecheck passes with current parity screens.

## Dashboard parity

### Implemented

- [x] Dashboard detail route: `artifacts/mobile/app/(app)/dashboard/[id].tsx`
- [x] Dashboard widgets are listed.
- [x] Dashboard data sources are listed.
- [x] Application metadata is visible.
- [x] User/admin dashboard endpoint previews are visible.
- [x] Widget create/update/delete is available through JSON actions.
- [x] Dashboard data source update/dispatch is available through JSON actions.
- [x] Application rename/update, duplicate, snapshot, and delete are available.

### Next dashboard work

- [x] Add native “New widget” modal.
- [x] Add widget type picker.
- [x] Add guided widget title/configuration fields.
- [x] Add data-source picker for widgets that need data.
- [x] Add data-source creation/connection flow.
- [x] Add layout basics: row, column, width, height.
- [x] Render basic widget cards using widget payloads instead of JSON previews only.
- [x] Add widget edit form for supported widget types.
- [x] Add dashboard layout editing controls.
- [x] Add validation before creating/updating widgets.

## Automation parity

### Implemented

- [x] Automation app route: `artifacts/mobile/app/(app)/automation/[id].tsx`
- [x] Automation workflow detail route: `artifacts/mobile/app/(app)/automation/workflow/[id].tsx`
- [x] Workflow list is visible.
- [x] Workflow creation is available.
- [x] Workflow update/delete/duplicate/order is available.
- [x] Workflow nodes are listed.
- [x] Node create/update/move/replace/delete/duplicate is available through JSON actions.
- [x] Workflow test action is available.
- [x] Workflow publish action is available.
- [x] Node simulation action is available.
- [x] Workflow run history is visible.

### Next automation work

- [x] Add guided trigger/action node picker.
- [x] Add native configuration form for common trigger nodes.
- [x] Add native configuration form for common action nodes.
- [ ] Add visual workflow/branch layout.
- [ ] Add parent/previous-node selection UI for moving nodes.
- [ ] Add test result detail viewer.
- [ ] Add publish validation and preflight warnings.
- [ ] Add run history detail screen.
- [ ] Add error-state display for failed workflow runs.

## Application Builder parity

### Implemented

- [x] Builder app route: `artifacts/mobile/app/(app)/builder/[id].tsx`
- [x] Builder page route: `artifacts/mobile/app/(app)/builder/page/[id].tsx`
- [x] Page list is visible.
- [x] Page creation is available.
- [x] Page update/delete/duplicate/order is available.
- [x] Domain list is visible.
- [x] Domain create/update/delete/order/publish is available.
- [x] Integrations are visible.
- [x] Integration create/update/move/delete is available.
- [x] User sources are visible.
- [x] Snapshots are visible and can be created.
- [x] Theme update is available through JSON.
- [x] Page elements are listed.
- [x] Page data sources are listed.
- [x] Page workflow actions are listed.
- [x] Element create/update/move/delete/duplicate is available through JSON actions.
- [x] Data source create/update/move/delete/dispatch is available through JSON actions.
- [x] Workflow action create/update/delete/dispatch/order is available through JSON actions.
- [x] Public builder preview endpoints are exposed.

### Next Application Builder work

- [ ] Add native element palette.
- [ ] Add guided create-element flow for common element types.
- [ ] Add element property editor panels.
- [ ] Add drag/drop or move controls for element layout/order.
- [ ] Add guided data-source setup forms.
- [ ] Add guided workflow-action setup forms.
- [ ] Add auth/user-source setup forms.
- [ ] Add custom CSS endpoint support.
- [ ] Add custom JS endpoint support.
- [ ] Add real page preview renderer.
- [ ] Add mobile-friendly page navigation preview.

## Recommended build order

- [x] Checkpoint 1: Dashboard guided widget creation and basic widget rendering.
- [ ] Checkpoint 2: Dashboard data-source picker/setup and widget edit forms.
- [x] Checkpoint 3: Automation guided node picker and native node forms.
- [ ] Checkpoint 4: Automation run detail and publish validation.
- [ ] Checkpoint 5: Application Builder element palette and property panels.
- [ ] Checkpoint 6: Application Builder data-source/action setup forms.
- [ ] Checkpoint 7: Application Builder preview renderer and custom code endpoints.
