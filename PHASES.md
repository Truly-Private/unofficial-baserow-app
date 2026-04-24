# Baserow Mobile – Phase Plan

This document outlines a plan to build a feature-complete Baserow mobile app with full desktop parity across three phases: API mapping, core feature implementation, and mobile UX enhancements.

PHASE 1 – API Mapping & Architecture

- Study: Review Baserow REST API docs (https://baserow.io/docs/apis/rest-api)
- Map endpoints required for desktop parity (databases, tables, rows, fields, views, filters, sorting, attachments, collaboration, real-time updates)
- Create a comprehensive API client architecture
- Document authentication flow and token management (login, refresh, logout, token expiry, persistence)
- Deliverables: API contract document, endpoint catalog, and a small scaffolded API client library

PHASE 2 – Core Features Implementation

- Database management: create, read, update, delete
- Table operations: CRUD, views, filters, sorting
- Row operations: add, edit, delete, bulk operations
- Field types support: all desktop field types
- Views: grid, gallery, form, kanban
- Filters and sorting: advanced capabilities per view
- Collaboration features: sharing, permissions
- Real-time updates: subscriptions/streams
- File uploads and attachments
- Deliverables: working API client, basic screens for each feature, and test data flow

PHASE 3 – Mobile UX

- Responsive mobile-first UI with deliberate visual language
- Touch-optimized interactions and gestures
- Offline support with sync and conflict resolution
- Push notifications integration
- Mobile-specific performance optimizations
- Deliverables: polished UI/UX, offline sync, and push notification workflow

Test credentials (for local testing, if needed):

- Email: testerson@binkmail.com
- Password: roshyf-rYqmyp-joggo4

Notes

- This document focuses on architecture and high-level implementation strategy. It does not commit to production-ready security or performance optimizations until Phase 2+.
- Upon completion of Phase 3, I will run the final system event as requested.
