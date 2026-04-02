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
| Config | `backend/src/config/env.ts` | ✅ | Env loading for Supabase URL and service role key |
| Supabase integration | `backend/src/integrations/supabase/client.ts` | ✅ | Service role client exists |
| Common errors | `backend/src/common/errors/*` | ✅ | AppError, Unauthorized, Forbidden, NotFound |
| Common middleware | `backend/src/common/middleware/*` | ✅ | Auth, validation, request logging, error handling, not found |
| Common types | `backend/src/common/types/*` | ✅ | User and authenticated request types |
| Common utils | `backend/src/common/utils/logger.ts` | ✅ | Debug logger exists |
| Auth module | `backend/src/modules/auth/*` | ✅ | Sync profile flow implemented |
| Users module | `backend/src/modules/users/*` | ✅ | `/v1/users/me` + admin user management endpoints implemented |
| Subjects module | `backend/src/modules/subjects/*` | ✅ | Subject list/detail + admin CRUD endpoints implemented |
| Resources module | `backend/src/modules/resources/*` | ✅ | Full lifecycle + moderation endpoint implemented |
| Downloads module | `backend/src/modules/downloads/*` | ❌ | Not present |
| Search module | `backend/src/modules/search/*` | ❌ | Not present |
| Admin module | `backend/src/modules/admin/*` | ❌ | Not present |
| Module router | `backend/src/modules/index.ts` | ✅ | Wires auth, users, admin-users, subjects, admin-subjects, admin-resources routers |

## 2. API Endpoints

| Endpoint | Module | Implemented? | Notes |
| --- | --- | --- | --- |
| `POST /v1/auth/sync` | Auth | ✅ | Syncs Supabase user into local profile |
| `GET /v1/users/me` | Users | ✅ | Returns current user profile |
| `GET /v1/subjects` | Subjects | ✅ | Read-only subject list |
| `GET /health` | App bootstrap | ✅ | Health check route |
| `PATCH /v1/users/me` | Users | ✅ | Self profile update implemented |
| `GET /v1/admin/users` | Users/Admin | ✅ | Admin user list with pagination and filters implemented |
| `GET /v1/admin/users/:id` | Users/Admin | ✅ | Admin user detail endpoint implemented |
| `PATCH /v1/admin/users/:id/role` | Users/Admin | ✅ | Admin role update implemented |
| `PATCH /v1/admin/users/:id/status` | Users/Admin | ✅ | Admin active status update implemented |
| `GET /v1/subjects/:id` | Subjects | ✅ | Subject detail endpoint implemented |
| `POST /v1/admin/subjects` | Subjects/Admin | ✅ | Admin subject creation implemented |
| `PATCH /v1/admin/subjects/:id` | Subjects/Admin | ✅ | Admin subject update implemented |
| `DELETE /v1/admin/subjects/:id` | Subjects/Admin | ✅ | Admin subject soft-delete implemented |
| `GET /v1/resources` | Resources | ✅ | Authenticated visible-resource list implemented |
| `GET /v1/resources/:id` | Resources | ✅ | Resource detail endpoint implemented |
| `POST /v1/resources` | Resources | ✅ | Creates draft resource metadata and upload session |
| `PATCH /v1/resources/:id` | Resources | ✅ | Resource metadata update implemented |
| `POST /v1/resources/:id/complete` | Resources | ✅ | Upload completion checkpoint implemented |
| `POST /v1/resources/:id/submit` | Resources | ✅ | Submit-to-review transition implemented |
| `DELETE /v1/resources/:id` | Resources | ✅ | Soft archive implemented |
| `PATCH /v1/admin/resources/:id/status` | Resources/Admin | ✅ | Admin moderation transition implemented |
| `POST /v1/resources/:id/download-url` | Resources/Downloads | ❌ | Download URL flow still belongs to the downloads slice |
| `GET /v1/downloads/me` | Downloads | ❌ | Missing module |
| `GET /v1/admin/downloads` | Downloads/Admin | ❌ | Missing module |
| `GET /v1/search/resources` | Search | ❌ | Missing module |
| `GET /v1/search/suggest` | Search | ❌ | Missing module |
| `POST /v1/admin/search/reindex` | Search/Admin | ❌ | Missing module |
| `POST /v1/admin/search/resources/:id/reindex` | Search/Admin | ❌ | Missing module |
| `GET /v1/faculty/dashboard/summary` | Admin/Faculty | ❌ | Missing module |
| `GET /v1/faculty/resources` | Resources | ❌ | Missing module |
| `GET /v1/faculty/resources/:id/stats` | Resources | ❌ | Missing module |

### Resource Lifecycle and Visibility Model

Resource lifecycle:
- `draft` → `pending_review` → `published`
- `draft` → `pending_review` → `rejected`
- `published` → `archived`
- `rejected` → `archived` (optional cleanup)

Status meanings:
- `draft`: initial state after creation
- `pending_review`: submitted for approval
- `published`: visible to all users
- `rejected`: rejected by moderator, visible only to owner/admin
- `archived`: soft deleted

Visibility rules:

| Role | draft | pending_review | published | rejected | archived |
| --- | --- | --- | --- | --- | --- |
| student | ❌ | ❌ | ✅ | ❌ | ❌ |
| faculty | ✅ (own only) | ✅ (own only) | ✅ | ✅ (own only) | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |

Status transitions are controlled by backend service logic.
Clients cannot directly set status on creation.

## 3. Database Mapping

| Table | Repository | Exists? | Notes |
| --- | --- | --- | --- |
| `roles` | No dedicated repository | ⚠️ | Role lookups are handled indirectly in auth/users repositories |
| `users` | `backend/src/modules/auth/auth.repository.ts`, `backend/src/modules/users/users.repository.ts` | ✅ | Role resolution uses `role_id` + `roles.code` |
| `subjects` | `backend/src/modules/subjects/subjects.repository.ts` | ✅ | Active-list + detail + admin CRUD repository implemented |
| `resources` | `backend/src/modules/resources/*` | ✅ | Repository and service implemented |
| `downloads` | `backend/src/modules/downloads/*` | ❌ | Missing |
| `user_subject_access` | Not implemented | ❌ | Planned only |
| `audit_logs` | Not implemented | ❌ | Planned only |

## 4. Flutter Mobile

| Pages | API Used | Implemented? | Notes |
| --- | --- | --- | --- |
| Splash screen | Auth bootstrap/session check | ✅ | Shows loading/error state |
| Login screen | Supabase login + backend auth sync flow | ✅ | Minimal functional login UI |
| Sign up screen | Supabase signup + backend auth sync flow | ✅ | Minimal functional signup UI |
| Home screen | `/v1/users/me` via auth controller | ✅ | Authenticated state and logout are wired |
| Subject list | `/v1/subjects` | ❌ | Not implemented |
| Subject detail | `/v1/subjects/:id` | ❌ | Not implemented |
| Notes list/detail | `/v1/resources` | ❌ | Not implemented |
| Downloads history | `/v1/downloads/me` | ❌ | Not implemented |
| Search screen | `/v1/search/resources` | ❌ | Not implemented |
| Faculty dashboard | `/v1/faculty/*` | ❌ | Not implemented |
| Admin panel | `/v1/admin/*` | ❌ | Not implemented |

### Mobile Structure Status

| Area | Status | Notes |
| --- | --- | --- |
| Riverpod state management | ✅ | Auth controller and providers exist |
| `go_router` navigation | ✅ | Splash -> Login -> Signup -> Home |
| Supabase bootstrap | ✅ | Initialized in app startup |
| Backend API client | ✅ | Thin HTTP wrapper exists |
| Feature-based structure | ⚠️ | Auth and home are organized; future features are still missing |

## 5. Frontend (Web)

| Screen | API Used | Implemented? | Notes |
| --- | --- | --- | --- |
| App shell | N/A | ⚠️ | Next.js App Router scaffold exists, but it still contains starter template content |
| Login | N/A | ❌ | Not implemented |
| Dashboard | N/A | ❌ | Not implemented |
| Notes browsing | N/A | ❌ | Not implemented |
| Search | N/A | ❌ | Not implemented |
| Admin panel | N/A | ❌ | Not implemented |

### Frontend Structure Status

| Area | Status | Notes |
| --- | --- | --- |
| `frontend/` folder | ✅ | Folder exists with Next.js project scaffold |
| Next.js setup | ✅ | App Router scaffold is initialized |
| API integration layer | ❌ | Missing backend client, auth sync, and feature service layer |

## 6. Feature Completeness Matrix

| Feature | Backend | Mobile | Web | Status |
| --- | --- | --- | --- | --- |
| Auth bootstrap | ✅ | ✅ | ⚠️ | Backend and mobile exist; web scaffold exists but auth pages are missing |
| Users profile | ✅ | ❌ | ❌ | Web profile flow missing |
| Subjects browsing | ✅ | ❌ | ❌ | Backend subject list/detail/admin CRUD are implemented |
| Resources lifecycle | ✅ | ❌ | ❌ | ⚠️ Backend lifecycle and moderation are implemented; clients still need content screens |
| Downloads tracking | ❌ | ❌ | ❌ | Not implemented yet |
| Search | ❌ | ❌ | ❌ | Not implemented yet |
| Faculty dashboard | ❌ | ❌ | ❌ | Not implemented yet |
| Admin panel | ❌ | ❌ | ❌ | Not implemented yet |
| App shell / navigation | ✅ | ✅ | ⚠️ | Web has a starter App Router scaffold, but production navigation/auth routes are missing |

## 7. Architectural Gaps

| Area | Problem | Impact | Recommendation |
| --- | --- | --- | --- |
| Resources module | Backend resources lifecycle exists, but mobile/web resource browsing is still missing | Users cannot browse content in client apps yet | Add mobile/web resource browsing and detail flows |
| Downloads module | Download logging and history are absent | No audit trail or usage analytics | Add `downloads` module and connect it to signed download flow |
| Search module | Algolia integration is missing | No fast discovery or subject-based search | Add search indexing sync after resource publish/update |
| Admin module | No dedicated admin module yet; only admin user-management endpoints exist inside users module | Content governance is still incomplete for resources/downloads/search | Implement full admin module after MVP content flow |
| Web backend integration | Next.js exists but is still starter-only | Web cannot consume auth/profile APIs yet | Add typed backend client and auth bootstrap flow |
| Mobile content browsing | Flutter covers auth only | Users cannot browse content in app | Add subjects/resources/downloads screens and repositories |
| API contract coverage | Auth/users/subjects are implemented, including admin user management and subjects CRUD endpoints | Endpoint surface is still incomplete for content lifecycle | Prioritize resources/downloads endpoints before UI expansion |

## 8. Technical Debt

| Area | Issue | Risk | Fix |
| --- | --- | --- | --- |
| Mobile feature depth | Auth flow exists but feature modules stop at home | Feature growth becomes ad hoc | Add feature folders for subjects/resources/downloads/search |
| Web app state | Starter Next.js page still shows template content | Production confusion and weak brand identity | Replace starter page with CMRIT Vault app shell and auth-aware layout |
| Backend module surface | Missing resources/downloads/search/admin modules | Prevents MVP completion | Implement modules in the planned order |
| Shared API contracts | No shared API DTO package between mobile and web | Drift risk across clients | Introduce a stable response/types layer if needed later |
| Content lifecycle | Client content flows are incomplete even though backend resources lifecycle exists | Upload/download/search cannot be end-to-end | Build client browsing and downstream slices next |

## 9. Production Risks

| Risk | Area | Severity | Mitigation |
| --- | --- | --- | --- |
| Schema drift | Backend DB access | High | Keep code aligned to `DATABASE_DESIGN.md` and review queries against the schema |
| Starter frontend exposure | Web | Medium | Replace template UI before user-facing release |
| Missing download tracking | Backend | High | Implement downloads module before content launch |
| Missing search | Backend + frontend | Medium | Add Algolia indexing and search UI in phase 3 |
| Incomplete admin controls | Backend | Medium | Build moderation and user management before scaling to large usage |
| Auth bootstrap regressions | Mobile | High | Preserve loading/error states and keep auth sync idempotent |

## 10. Roadmap

### Phase 1: Core MVP

| Item | Scope | Dependency |
| --- | --- | --- |
| Auth | Already done | Supabase Auth + backend sync |
| Users | ✅ Completed (self update + admin list/detail/role/status) | Auth + normalized role model |
| Subjects | ✅ Completed (list/detail + admin create/update/delete) | Backend service/repository expansion |
| Resources module | ✅ Full lifecycle + moderation completed | Supabase Storage + DB schema + role checks |
| Downloads module | Logging and history | Resources + signed download URLs |

### Phase 2: Usability

| Item | Scope | Dependency |
| --- | --- | --- |
| Mobile UI completion | Subjects, resources, downloads, search screens | Phase 1 APIs |
| Web UI pages | Next.js pages for auth/content browsing | Phase 1 APIs + backend client |
| Resource browsing + filtering | Subject, year, semester, type filters | Resources module |

### Phase 3: Advanced

| Item | Scope | Dependency |
| --- | --- | --- |
| Search | Algolia indexing and query endpoints | Resources metadata stability |
| Faculty dashboard | Upload oversight and status management | Resources module |
| Admin panel | User moderation and analytics | Users/resources/downloads modules |

### Phase 4: Production Hardening

| Item | Scope | Dependency |
| --- | --- | --- |
| Pagination | Cursor-based pagination everywhere | List endpoints |
| Caching | Stable metadata caching on client/API | Usage patterns |
| Rate limiting | Abuse prevention for auth/search endpoints | API gateway or middleware |
| Logging improvements | Structured request/error logs | Shared logging standards |
| Monitoring | Metrics, traces, alerts, startup health | Deployment environment |

## 11. Suggested Folder Structure (Final Form)

### Backend

| Layer | Suggested Structure |
| --- | --- |
| Entry | `src/app.ts`, `src/server.ts` |
| Config | `src/config/*` |
| Common | `src/common/errors`, `src/common/middleware`, `src/common/utils`, `src/common/types` |
| Integrations | `src/integrations/supabase`, `src/integrations/algolia` |
| Modules | `src/modules/auth`, `src/modules/users`, `src/modules/subjects`, `src/modules/resources`, `src/modules/downloads`, `src/modules/search`, `src/modules/admin` |
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

### Web (Next.js)

| Layer | Suggested Structure |
| --- | --- |
| App Router | `frontend/app/*` |
| Feature modules | `frontend/src/features/*` |
| API layer | `frontend/src/lib/api/*` |
| Auth | `frontend/src/lib/auth/*` |
| Shared UI | `frontend/src/components/*` |
| State | Server components plus local feature state where needed |

## 12. Top Priority Action Items

| Priority | Task | Area | Why it matters |
| --- | --- | --- | --- |
| 1 | Implement downloads module | Backend | Needed for tracking, history, and compliance |
| 2 | Replace Next.js starter page | Web | Current UI is only template content |
| 3 | Add web backend client and auth flow | Web | Required for future production use |
| 4 | Add content browsing screens to mobile | Mobile | Mobile app is auth-only right now |
| 5 | Add search module | Backend | Search depends on stable resource metadata |
| 6 | Add admin module | Backend + Web | Needed for moderation and operational control |
| 7 | Add production hardening | Cross-cutting | Needed before scaling beyond MVP usage |

## 13. Execution Plan (Single Source of Truth)

| Order | Task | Area | Why |
| --- | --- | --- | --- |
| 1 | ✅ Complete user endpoints (`PATCH /users/me`, admin list/detail/role/status) | Backend | Completed and validated |
| 2 | ✅ Complete subject CRUD (`GET/:id`, create/update/delete) | Backend | Completed and validated |
| 3 | ✅ Build resources module (full lifecycle + storage) | Backend | Core product |
| 4 | Build downloads module | Backend | Required for tracking |
| 5 | Implement mobile subject + resource browsing | Mobile | Uses backend APIs |
| 6 | Replace Next.js starter UI with app shell | Web | Clean UI foundation |
| 7 | Add web API client + auth integration | Web | Connect frontend to backend |
| 8 | Implement search (Algolia) | Backend | Depends on resources |
| 9 | Build admin module | Backend + Web | Needs all previous modules |
| 10 | Add pagination, logging, monitoring | All | Production readiness |
