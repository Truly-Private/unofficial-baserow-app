# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Express API server (scaffold; not used by the Baserow Mobile app).
- `artifacts/mockup-sandbox` — Vite-based component preview server for the canvas.
- `artifacts/mobile` — **Baserow Mobile** (Expo + React Native). Connects directly to the Baserow REST API (default `https://api.baserow.io`, supports self-hosted URLs). No custom backend; the app talks to Baserow from the device.
  - Auth: email/password → `POST /api/user/token-auth/`, JWT stored in AsyncStorage under `baserow.auth.v1`.
  - Routes: `/login`, `/(app)` (workspaces & databases), `/(app)/table/[id]`, `/(app)/row/[tableId]/[rowId]` (edit/delete), `/(app)/row/[tableId]/new`, `/(app)/settings`.
  - API client: `lib/baserow.ts`. Auth state: `contexts/AuthContext.tsx`.
  - Field rendering/editing: `components/FieldDisplay.tsx` and `components/FieldInput.tsx` cover text, long_text, url, email, phone, number, rating, boolean, date, single_select; read-only display for formula/lookup/link_row/file/multi_select/etc.
