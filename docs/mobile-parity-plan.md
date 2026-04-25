# Baserow Mobile Parity Plan

## Phase 1 - API Discovery

Source of truth:

- Baserow REST API docs: https://baserow.io/docs/apis/rest-api
- Baserow API host: https://api.baserow.io

Core authenticated endpoints used or mapped for mobile parity:

- Auth
  - `POST /api/user/token-auth/`
  - `POST /api/user/token-refresh/`
- Applications and databases
  - `GET /api/applications/`
  - `PATCH /api/applications/{application_id}/`
  - `DELETE /api/applications/{application_id}/`
- Tables
  - `GET /api/database/tables/database/{database_id}/`
  - `POST /api/database/tables/database/{database_id}/`
  - `PATCH /api/database/tables/{table_id}/`
  - `DELETE /api/database/tables/{table_id}/`
- Fields
  - `GET /api/database/fields/table/{table_id}/`
  - `POST /api/database/fields/table/{table_id}/`
  - `PATCH /api/database/fields/{field_id}/`
  - `DELETE /api/database/fields/{field_id}/`
- Views
  - `GET /api/database/views/table/{table_id}/`
  - `GET /api/database/views/{view_id}/filters/`
  - `GET /api/database/views/{view_id}/sortings/`
- Rows
  - `GET /api/database/rows/table/{table_id}/`
  - `GET /api/database/rows/table/{table_id}/{row_id}/`
  - `POST /api/database/rows/table/{table_id}/`
  - `PATCH /api/database/rows/table/{table_id}/{row_id}/`
  - `DELETE /api/database/rows/table/{table_id}/{row_id}/`
  - Important query params used by mobile:
    - `user_field_names=true`
    - `page`
    - `size`
    - `search`
    - `view_id`
    - `order_by`
- Files
  - `POST /api/user-files/upload-file/`
- Realtime
  - `GET /ws/core/?jwt_token=...`

## Desktop Features To Cover On Mobile

Desktop capability groups relevant to the current repo:

- Sign in and session refresh
- Browse workspaces, databases, and tables
- Browse rows with search
- Create, edit, and delete rows
- Field-aware editing for common Baserow field types
- File attachments
- Link-row selection
- Saved views
- View filters and saved sort visibility
- Manual sorting
- Large table pagination
- Multi-row selection and bulk destructive actions
- Realtime invalidation while tables or rows change

Desktop features not yet implemented in this repo before this pass:

- Saved view selection on mobile
- Visibility of saved filters and sort rules
- Explicit row sorting controls
- Pagination and load-more for larger tables
- Multi-select row mode with bulk deletion

## Repo Comparison

Before implementation:

- `artifacts/mobile/app/login.tsx`: complete sign-in flow
- `artifacts/mobile/app/(app)/index.tsx`: workspace and database listing
- `artifacts/mobile/app/(app)/database/[id].tsx`: table listing inside a database
- `artifacts/mobile/app/(app)/table/[id].tsx`: search, single-row delete, row navigation
- `artifacts/mobile/app/(app)/row/[tableId]/[rowId].tsx`: row edit
- `artifacts/mobile/app/(app)/row/[tableId]/new.tsx`: row create
- `artifacts/mobile/components/FieldInput.tsx`: type-aware field editors
- `artifacts/mobile/hooks/useBaserowRealtime.ts`: websocket refresh support

Gaps closed in this implementation:

- Added view discovery and view metadata queries to `artifacts/mobile/lib/baserow.ts`
- Added row query support for `view_id` and `order_by`
- Rebuilt the table screen around:
  - saved-view selection
  - visible saved filters
  - visible saved sort rules
  - manual sorting by field
  - infinite loading / pagination
  - row multi-select
  - bulk delete

## Phase 2 - Implementation Plan

Execution order used:

1. Extend the Baserow mobile client with view and row-list primitives.
2. Rebuild the table screen around desktop-style data controls.
3. Reuse existing row edit/create flows rather than fork new mutation paths.
4. Validate with typecheck.

## Validation

Planned validation:

- `pnpm --dir artifacts/mobile typecheck`
- Manual sign-in and table flow validation against:
  - `testerson@binkmail.com`
  - `roshyf-rYqmyp-joggo4`

Constraint:

- This workspace can typecheck locally, but live credential validation still depends on runtime network access from the Expo app environment.
