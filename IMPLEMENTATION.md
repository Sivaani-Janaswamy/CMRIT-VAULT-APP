# IMPLEMENTATION INVENTORY

This document maps the current CMRIT Vault codebase against the planned architecture and current repo state.

Legend:
- `✅` = exists and is usable
- `⚠️` = partially implemented or incomplete
- `❌` = missing

## 1. Backend Inventory

| Module | File/Folder | Exists? | Notes |
| --- | --- | --- | --- |
| App bootstrap | `backend/src/app.ts`, `backend/src/server.ts` | ✅ | Express app, middleware chain, health route |
| Config | `backend/src/config/env.ts` | ✅ | Env loading for Supabase and Algolia runtime configuration |
| Supabase integration | `backend/src/integrations/supabase/client.ts` | ✅ | Service role client exists |
| Common errors | `backend/src/common/errors/*` | ✅ | AppError, Unauthorized, Forbidden, NotFound |
| Common middleware | `backend/src/common/middleware/*` | ✅ | Auth, validation, request logging, error handling, not found |
| Common types | `backend/src/common/types/*` | ✅ | User/authenticated request types plus shared search contracts |
| Common utils | `backend/src/common/utils/logger.ts` | ✅ | Debug logger exists |
| Auth module | `backend/src/modules/auth/*` | ✅ | Sync profile flow implemented |
| Users module | `backend/src/modules/users/*` | ✅ | `/v1/users/me` + admin user management endpoints implemented |
| Subjects module | `backend/src/modules/subjects/*` | ✅ | Subject list/detail + admin CRUD endpoints implemented |
| Resources module | `backend/src/modules/resources/*` | ✅ | Full lifecycle + moderation endpoint implemented |
| Downloads module | `backend/src/modules/downloads/*` | ✅ | Signed URL + download history/audit endpoints implemented |
| Search module | `backend/src/modules/search/*` | ✅ | Algolia-backed search, suggestions, admin reindex endpoints, and lifecycle sync |
| Faculty module | `backend/src/modules/faculty/*` | ✅ | Faculty dashboard summary, resource list, and stats endpoints implemented |
| Admin module | `backend/src/modules/admin/*` | ✅ | Admin dashboard summary, resources overview, and downloads overview endpoints implemented |
| Module router | `backend/src/modules/index.ts` | ✅ | Wires all domain routers under `/v1` |

## 2. API Endpoints

| Endpoint | Module | Implemented? | Notes |
| --- | --- | --- | --- |
| `POST /v1/auth/sync` | Auth | ✅ | Syncs Supabase user into local profile |
| `GET/PATCH /v1/users/me` | Users | ✅ | Current user profile read/update |
| `GET /v1/subjects` | Subjects | ✅ | Subject list |
| `GET /v1/subjects/:id` | Subjects | ✅ | Subject detail |
| `POST/PATCH/DELETE /v1/admin/subjects` | Subjects/Admin | ✅ | Subject management |
| `GET /v1/resources` | Resources | ✅ | Authenticated visible-resource list |
| `GET /v1/resources/:id` | Resources | ✅ | Resource detail |
| `POST/PATCH/DELETE /v1/resources/*` | Resources | ✅ | Resource create/update/archive |
| `POST /v1/resources/:id/submit` | Resources | ✅ | Submit-to-review transition |
| `PATCH /v1/admin/resources/:id/status` | Resources/Admin | ✅ | Moderation transition |
| `POST /v1/resources/:id/download-url` | Downloads | ✅ | Signed URL + audit log |
| `GET /v1/downloads/me` | Downloads | ✅ | User download history |
| `GET /v1/admin/downloads` | Downloads/Admin | ✅ | Download audit history |
| `GET /v1/search/resources` | Search | ✅ | Algolia-backed search |
| `GET /v1/search/suggest` | Search | ✅ | Algolia autocomplete suggestions |
| `POST /v1/admin/search/*` | Search/Admin | ✅ | Reindex endpoints |
| `GET /v1/faculty/*` | Faculty | ✅ | Faculty summary/resources/stats |
| `GET /v1/admin/*` | Admin | ✅ | Admin summary/overview analytics |

## 3. Database Mapping

| Table | Repository | Exists? | Notes |
| --- | --- | --- | --- |
| `roles` | No dedicated repository | ⚠️ | Role lookups handled indirectly in auth/users repositories |
| `users` | `backend/src/modules/auth/*`, `backend/src/modules/users/*` | ✅ | Role resolution uses `role_id` + `roles.code` |
| `subjects` | `backend/src/modules/subjects/*` | ✅ | List/detail/admin CRUD implemented |
| `resources` | `backend/src/modules/resources/*` | ✅ | Repository and service implemented |
| `downloads` | `backend/src/modules/downloads/*` | ✅ | Repository/service/routes implemented |
| `audit_logs` | `backend/src/modules/admin/*` + Supabase table | ✅ | Persistent audit logging enabled |
| `user_subject_access` | Not implemented | ❌ | Planned only |

## 4. Flutter Mobile

| Pages | API Used | Implemented? | Notes |
| --- | --- | --- | --- |
| Splash screen | Auth bootstrap/session check | ✅ | Shows loading/error state |
| Login screen | Supabase login + backend auth sync flow | ✅ | Functional login UI |
| Sign up screen | Supabase signup + backend auth sync flow | ✅ | Functional signup UI |
| Home screen | `/v1/users/me` | ✅ | Auth state, logout, and browse flow wired |
| Subject list | `/v1/subjects` | ✅ | Loading/empty/error states included |
| Subject detail | `/v1/subjects/:id`, `/v1/resources` | ✅ | Subject metadata + resource list implemented |
| Notes list/detail | `/v1/resources`, `/v1/resources/:id` | ✅ | Browsing and detail implemented |
| Downloads history | `/v1/downloads/me` | ✅ | Read-only history list implemented |
| Search | `/v1/search/resources`, `/v1/search/suggest` | ✅ | Search + suggestions implemented |
| Download action | `POST /v1/resources/:id/download-url` | ✅ | Native open with clipboard fallback |
| Faculty dashboard | `/v1/faculty/*` | ✅ | Summary/resources/stats + lifecycle actions |
| Admin panel | `/v1/admin/*` | ✅ | Summary, users, moderation, downloads, subjects, search reindex |

### Mobile Structure Status

| Area | Status | Notes |
| --- | --- | --- |
| Riverpod state management | ✅ | Auth controller and providers exist |
| `go_router` navigation | ✅ | Splash -> Login/Signup -> Home + domain routes |
| Supabase bootstrap | ✅ | Initialized in app startup |
| Backend API client | ✅ | HTTP wrapper for student/faculty/admin APIs |
| Feature-based structure | ✅ | Auth/home/subjects/notes/downloads/search/faculty/admin modules |

## 5. Feature Completeness Matrix

| Feature | Backend | Mobile | Status |
| --- | --- | --- | --- |
| Auth bootstrap | ✅ | ✅ | Implemented end-to-end |
| Users profile | ✅ | ✅ | Implemented end-to-end |
| Subjects browsing | ✅ | ✅ | Implemented end-to-end |
| Resources lifecycle | ✅ | ✅ | Implemented end-to-end |
| Downloads tracking | ✅ | ✅ | Implemented end-to-end |
| Search | ✅ | ✅ | Implemented end-to-end |
| Faculty dashboard | ✅ | ✅ | Implemented end-to-end |
| Admin panel | ✅ | ✅ | Implemented end-to-end |
| App shell / navigation | ✅ | ✅ | Implemented end-to-end |

## 6. Architectural Gaps

| Area | Problem | Impact | Recommendation |
| --- | --- | --- | --- |
| API contract sharing | No shared DTO package between backend and mobile | Drift risk over time | Introduce shared schema/contracts (OpenAPI or generated models) |
| Pagination consistency | Mixed pagination behavior across list endpoints | Inconsistent UX and API client complexity | Standardize page/limit/cursor contracts |
| Download fallback UX | Clipboard fallback exists, but error messaging can improve | User confusion on failed launch/open | Improve fallback copy and retry affordances |
| Observability | Minimal structured logs and no traces/metrics in repo | Harder production incident triage | Add structured logs + metrics + alerting baseline |

## 7. Technical Debt

| Area | Issue | Risk | Fix |
| --- | --- | --- | --- |
| Logging | Request tracing and correlation IDs are limited | Slower debugging in production | Add request ID middleware and structured JSON logging |
| Validation hardening | Endpoint validation exists but can be expanded for edge payloads | Runtime handling complexity | Add stricter schema validation and negative tests |
| Contract governance | Manual contract syncing between backend/mobile | Regression risk | Add API contract generation and CI checks |
| Operations runbooks | No explicit deployment/rollback runbook in docs | Operational risk | Add deployment, rollback, and incident response runbooks |

## 8. Production Risks

| Risk | Area | Severity | Mitigation |
| --- | --- | --- | --- |
| Env/config drift | Backend runtime configuration | High | Validate required env vars at startup and in CI |
| Schema drift | Backend DB access | High | Keep code aligned to `DATABASE_DESIGN.md` and DB migrations |
| Auth/session regressions | Mobile | High | Preserve bootstrap/error states and keep auth sync idempotent |
| Insufficient observability | Backend + Mobile | Medium | Add metrics, traces, crash reporting, and alerts |
| Mobile offline resilience | Mobile | Medium | Add explicit offline/read-cache strategy and retry policies |

## 9. Roadmap

### Phase 1: Core MVP (Completed)

| Item | Scope | Dependency |
| --- | --- | --- |
| Auth | Completed | Supabase Auth + backend sync |
| Users | Completed | Auth + normalized role model |
| Subjects | Completed | Backend service/repository expansion |
| Resources module | Completed | Supabase Storage + DB schema + role checks |
| Downloads module | Completed | Resources + signed URLs |

### Phase 2: Usability (Mostly Completed)

| Item | Scope | Dependency |
| --- | --- | --- |
| Mobile UI completion | Completed | Phase 1 APIs |
| Resource browsing + filtering | Implemented | Resources module |
| Search and suggestions UX tuning | In progress | Search backend stability |

### Phase 3: Operations and Scale (Pending)

| Item | Scope | Dependency |
| --- | --- | --- |
| Pagination standardization | Consistent list contracts | List endpoints |
| Caching strategy | Stable metadata caching | Usage patterns |
| Rate limiting | Abuse prevention for auth/search/download endpoints | API middleware/gateway |
| Logging improvements | Structured request/error logs + correlation IDs | Shared logging standards |
| Monitoring | Metrics, traces, alerts, startup health | Deployment environment |

## 10. Suggested Folder Structure (Final Form)

### Backend

| Layer | Suggested Structure |
| --- | --- |
| Entry | `src/app.ts`, `src/server.ts` |
| Config | `src/config/*` |
| Common | `src/common/errors`, `src/common/middleware`, `src/common/utils`, `src/common/types` |
| Integrations | `src/integrations/supabase`, `src/integrations/algolia.integration.ts` |
| Modules | `src/modules/auth`, `src/modules/users`, `src/modules/subjects`, `src/modules/resources`, `src/modules/downloads`, `src/modules/search`, `src/modules/faculty`, `src/modules/admin` |
| Tests | `tests/` or module-local tests |

### Mobile (Flutter)

| Layer | Suggested Structure |
| --- | --- |
| App | `lib/app/*` |
| Core | `lib/core/*` |
| Features | `lib/features/auth`, `lib/features/home`, `lib/features/subjects`, `lib/features/notes`, `lib/features/downloads`, `lib/features/faculty`, `lib/features/admin`, `lib/features/search` |
| State | Riverpod |
| Routing | `go_router` |
| Data | Feature repositories and thin API services |
