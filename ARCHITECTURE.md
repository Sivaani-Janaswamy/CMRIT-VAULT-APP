# ARCHITECTURE

This document is the project entry point for CMRIT Vault.

It captures the long-term architecture, the canonical design decisions, the project phases, and the rules future contributors should follow when extending or fixing the system.

If a code change conflicts with this document, update the code to match the architecture unless the architecture itself is intentionally revised.

## 1. Project Vision

CMRIT Vault is a scalable academic content platform for:

| Capability | Purpose |
|---|---|
| Notes repository | Store and distribute study notes |
| Previous year question papers | Make exam papers searchable and downloadable |
| Faculty uploads | Allow faculty to publish official content |
| Student authentication | Secure campus user access |
| Search functionality | Fast discovery of content |
| Download tracking | Track content consumption and usage |

The platform is designed as a mobile-first system with a stable backend contract.

## 2. Canonical References

| Document | Role |
|---|---|
| `DATABASE_DESIGN.md` | Canonical schema reference and contract source of truth |
| This file | Canonical project architecture and planning reference |

When building new features, always check these documents first.

## 3. Architecture Summary

CMRIT Vault uses a Supabase-first architecture with a thin Node.js API layer.

| Layer | Responsibility |
|---|---|
| Flutter mobile app | UI, local state, auth session handling, browsing, uploads, downloads |
| Node.js API | Business rules, role checks, signed URLs, download tracking, search sync |
| Supabase Auth | Login, token management, session refresh |
| Supabase Postgres | Source of truth for metadata and relationships |
| Supabase Storage | Private file storage |
| Algolia | Search index and autocomplete |
| Future clients later | Reuse the same API and schema without changing backend contracts |

## 4. Core Design Principles

| Principle | Meaning |
|---|---|
| Layered architecture | Keep controllers, services, and repositories separate |
| Stateless backend | Allow horizontal scaling without server-local state |
| Private by default | Files must not be public buckets |
| Metadata in Postgres | Store relationships, access data, and lifecycle state in the database |
| Search as a read model | Algolia is only for search, never authorization |
| Modular by feature | Organize code by auth, users, subjects, resources, downloads, search, faculty, admin |
| API first | Mobile clients should consume stable backend contracts |
| Canonical schema first | The database schema drives backend and app contracts |

## 5. Canonical Data Model

The normalized role model is the project standard.

| Concept | Canonical Form |
|---|---|
| Roles | `roles` table with `code` values such as `student`, `faculty`, `admin` |
| Users | `users.role_id` references `roles.id` |
| API-facing role string | Derived from `roles.code` |
| User profile | `full_name`, `email`, `roll_no`, `department`, `semester`, `is_active` |
| Content | `resources` is the central content table |
| Downloads | `downloads` records access history |

Important:
- `users.role` is not part of the canonical schema contract
- backend should resolve role by joining `users.role_id -> roles.id`
- mobile should receive role as a string in API responses, but that string must come from `roles.code`

## 6. Database Entities

| Table | Purpose |
|---|---|
| `roles` | Role lookup and permission mapping |
| `users` | Auth-linked user profile |
| `subjects` | Subject catalog and filters |
| `resources` | Notes, question papers, and faculty uploads |
| `downloads` | Download audit trail |

## 7. Backend Design

### API Style

REST-first with a few hybrid endpoints for signed uploads, signed downloads, and search.

### Backend Responsibilities

| Responsibility | Handled By |
|---|---|
| Authentication sync | Node API + Supabase Auth |
| User profile fetching | Node API |
| Subject browsing | Node API |
| Resource lifecycle | Node API |
| Download tracking | Node API |
| Search sync and queries | Node API + Algolia |
| Signed file URLs | Node API + Supabase Storage |

### Backend Layering

| Layer | Role |
|---|---|
| Controller | Request parsing, response formatting, status codes |
| Service | Business logic, authorization decisions, orchestration |
| Repository | Database queries and persistence |
| Integration | Supabase client, Algolia client, storage utilities |

Repositories stay database-only. External search calls belong in the integration layer and are orchestrated by services.

### Search Runtime Config

Algolia runtime env vars:
- `ALGOLIA_APP_ID`
- `ALGOLIA_SEARCH_KEY`
- `ALGOLIA_ADMIN_KEY`
- `ALGOLIA_SEARCH_HOST`
- `ALGOLIA_ADMIN_HOST`
- `ALGOLIA_INDEX_NAME`

Use the DSN/search host for read queries and the admin host for write/reindex operations.

### Backend Modules

| Module | Responsibility |
|---|---|
| Auth | Sync Supabase user into local profile |
| Users | Self profile and admin user management |
| Subjects | Read-only access for MVP, admin later |
| Resources | Content CRUD, moderation, visibility rules |
| Downloads | History and audit |
| Search | Algolia indexing and query flow |
| Faculty | Faculty-scoped dashboard, resource listing, and per-resource stats |
| Admin | Analytics and moderation support |

## 8. Mobile Architecture

### State Management

Riverpod is the default state management solution.

Why:
- clean dependency injection
- easy async state handling
- good fit for auth bootstrap and role-based navigation
- scales better than ad hoc local state for this app

### Routing

`go_router` is the navigation standard.

### Mobile Structure

| Area | Role |
|---|---|
| app | App bootstrap, router, theme, startup orchestration |
| core | Shared network, storage, logging, and utilities |
| features | Feature-based modules for auth, home, subjects, notes, downloads, faculty, admin, search |
| shared | Reusable models and constants |

## 9. Navigation Model

| State | Navigation |
|---|---|
| Unauthenticated | Splash -> Login |
| Authenticating | Splash loading state |
| Authenticated student | Home -> Subjects -> Notes -> Search -> Downloads |
| Authenticated faculty | Home -> Faculty dashboard -> My uploads/resources lifecycle -> Resource stats |
| Authenticated admin | Home -> Admin dashboard -> Resources overview -> Downloads overview |

The app should never show a blank screen during auth transitions.

## 10. Resource Lifecycle and Visibility Model

### Status Lifecycle

draft → pending_review → published  
pending_review → rejected  
any → archived

### Role Permissions


| Role | draft | pending_review | published | rejected | archived |
| --- | --- | --- | --- | --- | --- |
| student | ❌ | ❌ | ✅ | ❌ | ❌ |
| faculty | ✅ (own only) | ✅ (own only) | ✅ | ✅ (own only) | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |

### Visibility Rules

- Students can only see `published` resources
- Faculty can see:
  - all published resources
  - their own draft, rejected and pending resources
- Admin can see all resources
- Dedicated faculty endpoints (`/v1/faculty/*`) may include faculty-owned archived resources for management and analytics; admin scope remains global.

### Moderation

- Only admin can change status:
  - pending_review → published
  - pending_review → rejected

### Endpoints

- POST /v1/resources → create draft
- POST /v1/resources/:id/submit → draft → pending_review
- PATCH /v1/admin/resources/:id/status → publish/reject
- DELETE /v1/resources/:id → archive

## 11. Feature Map

### Phase 1: MVP

| Feature | Scope |
|---|---|
| Authentication | Supabase email/password and session bootstrap |
| Profile sync | Backend `/v1/auth/sync` and `/v1/users/me` |
| Subject filtering | List and filter subjects |
| Resource upload | Faculty uploads with private storage and metadata |
| Resource download | Signed URLs with tracking |

### Phase 2: Growth

| Feature | Scope |
|---|---|
| Search | Algolia powered search and suggestions |
| Faculty dashboard | Upload status and history |
| Moderation flow | Draft, review, publish, reject |
| Better filters | Academic year, semester, type, subject |

### Phase 3: Operations and Scale

| Feature | Scope |
|---|---|
| Analytics | Download trends, popular subjects, active content |
| Admin panel | Backend admin analytics endpoints implemented; mobile admin surfaces implemented |
| Audit logs | Security and operational tracing |

## 12. Security Model

| Area | Rule |
|---|---|
| Auth | Supabase JWT is the source of authenticated identity |
| Authorization | Use role checks in backend and RLS in the database |
| File access | Private bucket, signed URLs only |
| Database access | Prefer service-role backend access only where required |
| Logging | Never log passwords, tokens, secrets, or raw auth headers |
| Sensitive state | Keep user session and tokens secure on device |

## 13. Performance Model

| Area | Strategy |
|---|---|
| Caching | Cache stable metadata on mobile and at the API where safe |
| Pagination | Use pagination for all list endpoints |
| Query optimization | Use indexes for role, subject, status, semester, and created_at filters |
| File delivery | Serve files through signed URLs and storage CDN paths |
| Search | Use Algolia for fast discovery instead of database text search |

## 14. Important Project Rules

| Rule | Meaning |
|---|---|
| Keep controllers thin | Do not place business logic in controllers |
| Keep repositories focused | Repositories should only talk to the database |
| Keep API responses stable | Preserve existing response shapes when possible |
| Avoid duplicate role storage | Do not introduce `users.role` alongside `users.role_id` |
| Preserve the central content model | Use `resources` for content unless there is a strong reason to split |
| Update contracts together | Schema, backend, and mobile expectations must stay aligned |
| Prefer small changes | Keep diffs focused and production-safe |

## 15. Schema and Contract Alignment

The schema is the contract.

| Canonical Field | Expected Use |
|---|---|
| `roles.code` | App-facing role string |
| `users.role_id` | Role foreign key |
| `users.full_name` | Display name |
| `subjects.code` | Subject identifier |
| `resources.status` | Lifecycle state |
| `downloads.resource_title` | Snapshot title at download time |

Any new feature should reuse these contracts instead of introducing parallel concepts.

## 16. Future Extension Guidelines

### When adding a new feature

1. Check `DATABASE_DESIGN.md` and this file first.
2. Decide whether the feature belongs in an existing module or a new feature module.
3. Keep data access inside repositories.
4. Keep business rules inside services.
5. Keep controllers thin and explicit.
6. Preserve response shapes used by mobile unless a coordinated contract change is planned.

### When changing schema

| Rule | Meaning |
|---|---|
| Add migrations first | Schema changes must be tracked |
| Update this file | Keep architecture reference current |
| Update backend queries | Align repositories with schema |
| Update mobile parsing | Keep API contract compatible |
| Validate RLS and indexes | Ensure security and performance remain intact |

## 17. Working State Summary

| Area | Current State |
|---|---|
| Backend | Node.js API scaffold exists with auth, users, subjects, resources, downloads, search, faculty, and admin modules |
| Mobile | Flutter app includes Supabase auth bootstrap and role-aware routing with student browsing, faculty dashboard/resources lifecycle/stats, and expanded admin surfaces (analytics/moderation, users list/detail role-status management, subject create/manage, downloads audit, and search reindex action) |
| Schema reference | `DATABASE_DESIGN.md` is the canonical schema file |
| Search | Algolia-backed read-model implemented; mobile search + suggestions UI is implemented |
| Faculty dashboard | Backend faculty endpoints implemented; mobile faculty dashboard/resources lifecycle/stats UI is implemented |
| Admin analytics | Backend admin summary/resources overview/downloads overview endpoints implemented; mobile admin analytics + management UI is implemented |
| Resources and downloads backend modules | Implemented; only client screens and refinements remain |

## 18. Final Note

This project should stay simple, modular, and production-oriented.

Build only what is needed for the current phase, but keep the architecture strong enough to support thousands of users.
