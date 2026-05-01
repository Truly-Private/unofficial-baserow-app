# Baserow Mobile — CLAUDE.md

## Project Overview

This is a React Native / Expo Router mobile app for Baserow (https://baserow.io), an open-source no-code database platform. The app connects to a Baserow instance via REST API and provides mobile-native access to databases, tables, rows, the no-code builder, automations, dashboards, AI chat, and more.

- **Mobile app source**: `artifacts/mobile/`
- **API spec**: `baserow-api-spec.json` (OpenAPI 3.1, 373 paths)
- **Repo**: https://github.com/Truly-Private/unofficial-baserow-app
- **Test credentials**: testerson@binkmail.com / [redacted]
- **Test Baserow instance**: https://api.baserow.io (or configure custom in Settings)

## Tech Stack

- **Framework**: Expo Router (file-based routing)
- **Language**: TypeScript
- **State**: React Query (`@tanstack/react-query`)
- **Styling**: React Native StyleSheet (inline styles + theme via `useColors()`)
- **Icons**: `@expo/vector-icons` (Feather set)
- **Auth**: JWT + refresh token stored in `SecureStore`
- **Package manager**: pnpm (root) — do NOT use npm or yarn
- **Build**: `pnpm build` (typecheck only, no actual native build here)

## Directory Layout

```
artifacts/mobile/
  app/                    # Expo Router pages
    (app)/                # Authenticated routes (Stack navigator)
      index.tsx           # Home — workspace/app browser
      settings.tsx        # User settings
      notifications.tsx   # Notifications
      ai-chat.tsx         # AI chat
      admin.tsx           # Admin panel (superusers only)
      automation/         # Automation screens
      builder/            # No-code builder screens
      dashboard/         # Dashboard screens
      database/           # Database browser
      row/                # Row create/edit/detail
      table/              # Table view
    _layout.tsx           # Root layout (auth gate)
    login.tsx             # Login page
  lib/
    baserow.ts            # 156 typed API functions (main API layer)
    admin.ts              # 28 Admin API functions (superuser only)
    storage.ts            # SecureStorage wrapper
    utils.ts              # Helpers (formatting, etc.)
  contexts/
    AuthContext.tsx       # Auth state + token refresh
    ThemeContext.tsx      # Theme provider
  components/             # Shared UI components
  hooks/                  # Custom hooks
  e2e/                    # Playwright E2E tests
```

## Key Conventions

### API Layer (`lib/baserow.ts` / `lib/admin.ts`)

- Every function follows the pattern: `export async function list|get|create|update|deleteEntityName(creds, ...params)`
- `creds` is always the first argument: `{ baseUrl: string, jwt: string, refreshToken: string }`
- All functions use the exported `request<T>()` helper which handles JSON + error parsing
- Types are defined inline and exported with `export type`
- Admin functions live in `lib/admin.ts` and require superuser privileges

### Screen Patterns

- Each route uses `useAuth()` from `@/contexts/AuthContext` for credentials
- Data fetching via `useQuery({ queryKey, queryFn })` from `@tanstack/react-query`
- Mutations via `useMutation({ mutationFn, onSuccess })`
- UI built from shared components in `@/components/` (Button, ErrorState, LoadingState, EmptyState, etc.)
- Colors via `useColors()` hook — returns `{ primary, background, card, text, mutedForeground, ... }`

### Styling

- Inline StyleSheet styles (no Tailwind, no CSS files)
- Theme values from `useColors()` for consistent theming
- `useSafeAreaInsets()` for notch/home bar handling
- `useWebInsets()` for web viewport insets

### Testing

- Playwright E2E tests in `e2e/*.spec.ts`
- Tests use `data-testid` attributes on key interactive elements
- Viewport: 375x812 (iPhone-sized)

## Working with Feature Branches

**IMPORTANT**: Do NOT push to `main`. All new work goes on feature branches.

Workflow:
1. `git checkout main && git pull`
2. `git checkout -b feature/<category>-v2`
3. Implement: API → Screen → E2E test
4. `git merge origin/main` (pull latest main into your branch)
5. `git push -u origin feature/<category>-v2`

## Git Conventions

- Commits follow Conventional Commits: `feat(...)`, `fix(...)`, `chore(...)`
- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- No force push to shared branches
- PRs created via GitHub UI after pushing branch

## TypeScript Notes

- Strict mode enabled
- `@/` path alias resolves to `artifacts/mobile/`
- There is a **pre-existing ES5 target issue** in `lib/baserow.ts` — TypeScript compiler errors about `Promise`, `Set`, `Array.find`, etc. These are pre-existing and NOT caused by new code. Do NOT "fix" the tsconfig or target to resolve them — that would require broader migration.
- Admin API types live in `lib/admin.ts` alongside the functions

## API Spec

The full OpenAPI spec is in `baserow-api-spec.json`. All 373 endpoints are documented there with request/response schemas. The mobile lib covers all mobile-relevant paths (~156 functions).
