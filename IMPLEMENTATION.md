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
| Common types | `backend/src/common/types/*` | ✅ | User/authenticated request types plus shared search contracts (`search-contracts.ts`) |
| Common utils | `backend/src/common/utils/logger.ts` | ✅ | Debug logger exists |
| Auth module | `backend/src/modules/auth/*` | ✅ | Sync profile flow implemented |
| Users module | `backend/src/modules/users/*` | ✅ | `/v1/users/me` + admin user management endpoints implemented |
| Subjects module | `backend/src/modules/subjects/*` | ✅ | Subject list/detail + admin CRUD endpoints implemented |
| Resources module | `backend/src/modules/resources/*` | ✅ | Full lifecycle + moderation endpoint implemented |
| Downloads module | `backend/src/modules/downloads/*` | ✅ | Signed URL + download history/audit endpoints implemented |
| Search module | `backend/src/modules/search/*` | ✅ | Algolia-backed search, suggestions, admin reindex endpoints, and best-effort auto-sync on resource lifecycle changes implemented; env vars: `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_KEY`, `ALGOLIA_ADMIN_KEY`, `ALGOLIA_SEARCH_HOST`, `ALGOLIA_ADMIN_HOST`, `ALGOLIA_INDEX_NAME` |
| Faculty module | `backend/src/modules/faculty/*` | ✅ | Faculty dashboard summary, resource list, and stats endpoints implemented |
| Admin module | `backend/src/modules/admin/*` | ✅ | Admin dashboard summary, resources overview, and downloads overview endpoints implemented |
| Module router | `backend/src/modules/index.ts` | ✅ | Wires auth, admin, users, admin-users, subjects, admin-subjects, resources, admin-resources, resource-downloads, downloads, admin-downloads, faculty, search, and admin-search routers |

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
| `POST /v1/resources/:id/download-url` | Resources/Downloads | ✅ | Signed download URL creation + audit logging implemented |
| `GET /v1/downloads/me` | Downloads | ✅ | Caller-scoped download history with filters implemented |
| `GET /v1/admin/downloads` | Downloads/Admin | ✅ | Admin audit history with filters implemented |
| `GET /v1/search/resources` | Search | ✅ | Algolia-backed search results implemented |
| `GET /v1/search/suggest` | Search | ✅ | Algolia-backed autocomplete suggestions implemented |
| `POST /v1/admin/search/reindex` | Search/Admin | ✅ | Admin-only bulk reindex implemented (manual recovery/backfill) |
| `POST /v1/admin/search/resources/:id/reindex` | Search/Admin | ✅ | Admin-only single-resource reindex implemented (manual recovery/backfill) |
| `GET /v1/admin/dashboard/summary` | Admin | ✅ | Admin analytics summary implemented |
| `GET /v1/admin/resources/overview` | Admin | ✅ | Admin resources overview with filters implemented |
| `GET /v1/admin/downloads/overview` | Admin | ✅ | Admin downloads overview with filters implemented |
| `GET /v1/faculty/dashboard/summary` | Faculty | ✅ | Faculty dashboard summary implemented |
| `GET /v1/faculty/resources` | Faculty | ✅ | Faculty resource list implemented |
| `GET /v1/faculty/resources/:id/stats` | Faculty | ✅ | Faculty resource stats implemented |

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

Faculty endpoint note: `/v1/faculty/*` may include faculty-owned archived resources (and admin-global scope) for management and stats use cases only.

## 3. Database Mapping

| Table | Repository | Exists? | Notes |
| --- | --- | --- | --- |
| `roles` | No dedicated repository | ⚠️ | Role lookups are handled indirectly in auth/users repositories |
| `users` | `backend/src/modules/auth/auth.repository.ts`, `backend/src/modules/users/users.repository.ts` | ✅ | Role resolution uses `role_id` + `roles.code` |
| `subjects` | `backend/src/modules/subjects/subjects.repository.ts` | ✅ | Active-list + detail + admin CRUD repository implemented |
| `resources` | `backend/src/modules/resources/*` | ✅ | Repository and service implemented |
| `downloads` | `backend/src/modules/downloads/*` | ✅ | Repository/service/routes implemented |
| `user_subject_access` | Not implemented | ❌ | Planned only |
| `audit_logs` | `backend/src/modules/admin/admin.repository.ts` + Supabase `audit_logs` table | ✅ | Persistent audit logging is enabled with table, indexes, and RLS applied |

## 4. Flutter Mobile

| Pages | API Used | Implemented? | Notes |
| --- | --- | --- | --- |
| Splash screen | Auth bootstrap/session check | ✅ | Shows loading/error state |
| Login screen | Supabase login + backend auth sync flow | ✅ | Minimal functional login UI |
| Sign up screen | Supabase signup + backend auth sync flow | ✅ | Minimal functional signup UI |
| Home screen | `/v1/users/me` via auth controller | ✅ | Authenticated state, logout, and Browse Subjects entry point are wired |
| Subject list | `/v1/subjects` | ✅ | Implemented with list UI, loading/empty/error states |
| Subject detail | `/v1/resources?subjectId=...` | ✅ | Implemented as subject resource list |
| Notes list/detail | `/v1/resources`, `/v1/resources/:id` | ✅ | Resource list and detail screen implemented |
| Downloads history | `/v1/downloads/me` | ✅ | Read-only history list implemented |
| Search screen | `/v1/search/resources` | ✅ | Implemented with submit-to-search UI and tappable results |
| Download action (resource detail) | `POST /v1/resources/:id/download-url` | ✅ | Signed URL request opens natively; clipboard fallback remains for devices that cannot launch the URL |
| Faculty dashboard | `/v1/faculty/*` | ✅ | Implemented with role-aware route guard, dashboard summary, resources list, create/edit form, submit/archive actions, and per-resource stats |
| Admin panel | `/v1/admin/*` | ✅ | Implemented with role-aware route guard, dashboard summary, resources overview, downloads overview, and moderation actions |

### Mobile Structure Status

| Area | Status | Notes |
| --- | --- | --- |
| Riverpod state management | ✅ | Auth controller and providers exist |
| `go_router` navigation | ✅ | Splash -> Login -> Signup -> Home + Subjects + Resource detail + Downloads + Search + Admin routes + Faculty routes |
| Supabase bootstrap | ✅ | Initialized in app startup |
| Backend API client | ✅ | Thin HTTP wrapper includes subjects/resources/download-url/downloads-history/search plus admin and faculty summary/overview/lifecycle/stats methods |
| Feature-based structure | ✅ | Auth, home, subjects/resources, downloads-history, search, admin, and faculty modules are organized |

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
| Subjects browsing | ✅ | ✅ | ❌ | Mobile subject list + subject resource browsing are implemented |
| Resources lifecycle | ✅ | ✅ | ❌ | Backend lifecycle is complete; mobile supports faculty create/update/submit/archive and admin moderation |
| Downloads tracking | ✅ | ✅ | ❌ | Backend endpoints are implemented; mobile history and native open/download UX are implemented; web history remains pending |
| Search | ✅ | ✅ | ❌ | Backend Algolia search is implemented; mobile search screen is implemented; web search remains missing |
| Faculty dashboard | ✅ | ✅ | ❌ | ⚠️ Backend faculty endpoints are implemented; mobile dashboard/resources/stats are live, web faculty UI is pending |
| Admin panel | ✅ | ✅ | ❌ | ⚠️ Backend admin analytics endpoints are implemented; mobile admin UI is live, web admin UI is pending |
| App shell / navigation | ✅ | ✅ | ⚠️ | Web has a starter App Router scaffold, but production navigation/auth routes are missing |

## 7. Architectural Gaps

| Area | Problem | Impact | Recommendation |
| --- | --- | --- | --- |
| Resources module | Backend resources lifecycle exists; mobile browsing is now implemented, but web resource browsing is still missing | Web users cannot browse content yet | Add web resource browsing and detail flows |
| Downloads module | Backend downloads slice is implemented; mobile history screen exists, but web history UX is still missing | Users cannot access history from web yet | Add web downloads history screen and integration |
| Download UX | Mobile now opens signed URLs natively with clipboard fallback when device launch fails | Fallback/error messaging can still be improved | Keep native-first behavior and refine user-facing failure messaging |
| Search client surfaces | Backend Algolia search exists; mobile search is implemented; web search is still missing | Discovery UX is still missing on web | Add web search screens, filters, and suggestion UI |
| Admin module | Dedicated admin module exists for analytics and moderation; mobile admin client surfaces are implemented and web admin is pending | Admin operations are now user-facing on mobile, but web parity is missing | Implement web admin screens and workflows |
| Web backend integration | Next.js exists but is still starter-only | Web cannot consume auth/profile APIs yet | Add typed backend client and auth bootstrap flow |
| Mobile content browsing | Subjects/resources browsing, downloads history, and search are implemented | Core browsing and download consumption work, and discovery is now available on mobile | Focus next on web discovery surfaces |
| API contract coverage | Auth/users/subjects/resources/downloads/faculty/search/admin backend endpoints are implemented | Client adoption is still incomplete for faculty and web admin/dashboard surfaces | Prioritize faculty client screens and web dashboard/admin/search surfaces next |

## 8. Technical Debt

| Area | Issue | Risk | Fix |
| --- | --- | --- | --- |
| Mobile feature depth | Subjects/resources browsing, downloads history, search, admin panel, and faculty lifecycle/stats are implemented | Primary remaining client imbalance is now web parity by role | Continue role-surface parity work on web |
| Web app state | Starter Next.js page still shows template content | Production confusion and weak brand identity | Replace starter page with CMRIT Vault app shell and auth-aware layout |
| Backend module surface | Core backend modules including admin are implemented | Remaining risk is client adoption and operational hardening | Focus on client integration + production hardening |
| Shared API contracts | No shared API DTO package between mobile and web | Drift risk across clients | Introduce a stable response/types layer if needed later |
| Content lifecycle | Mobile browsing plus native download flow, search, admin moderation, and faculty lifecycle are available | UX is strong on mobile but still not complete on web role surfaces | Build web role surfaces next |

## 9. Production Risks

| Risk | Area | Severity | Mitigation |
| --- | --- | --- | --- |
| Schema drift | Backend DB access | High | Keep code aligned to `DATABASE_DESIGN.md` and review queries against the schema |
| Starter frontend exposure | Web | Medium | Replace template UI before user-facing release |
| Download fallback UX gap | Mobile | Low | Improve fallback and error messages when automatic URL launch is unavailable |
| Download history UX gap | Mobile/Web | Medium | Implement web downloads history and signed URL consumption flows |
| Client search UX gap | Web | Medium | Add web search screens and connect them to the backend search APIs |
| Incomplete admin controls on web | Web | Medium | Build web admin client screens over already available backend admin endpoints |
| Auth bootstrap regressions | Mobile | High | Preserve loading/error states and keep auth sync idempotent |

## 10. Roadmap

### Phase 1: Core MVP

| Item | Scope | Dependency |
| --- | --- | --- |
| Auth | Already done | Supabase Auth + backend sync |
| Users | ✅ Completed (self update + admin list/detail/role/status) | Auth + normalized role model |
| Subjects | ✅ Completed (list/detail + admin create/update/delete) | Backend service/repository expansion |
| Resources module | ✅ Full lifecycle + moderation completed | Supabase Storage + DB schema + role checks |
| Downloads module | ✅ Logging and history completed | Resources + signed download URLs |

### Phase 2: Usability

| Item | Scope | Dependency |
| --- | --- | --- |
| Mobile UI completion | ✅ Subjects + resources browsing, downloads history, and search implemented | Phase 1 APIs |
| Web UI pages | Next.js pages for auth/content browsing | Phase 1 APIs + backend client |
| Resource browsing + filtering | Subject, year, semester, type filters | Resources module |

### Phase 3: Advanced

| Item | Scope | Dependency |
| --- | --- | --- |
| Search | Algolia relevance tuning, indexing sync validation, and result ranking refinements | Search backend stability |
| Faculty dashboard | Mobile faculty dashboard/resources lifecycle/stats UI is implemented; web faculty UI remains | Resources module |
| Admin panel | Mobile analytics/moderation UI is implemented; web admin UI remains | Users/resources/downloads modules |

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
| 1 | ✅ Implement downloads module | Backend | Completed and validated |
| 2 | ✅ Add mobile subject/resource browsing flow | Mobile | Completed and manually validated on emulator |
| 3 | ✅ Implement native download completion UX from resource detail | Mobile | Signed URLs now open natively with a clipboard fallback |
| 4 | Replace Next.js starter page and add landing/auth shell | Web | Landing/home surfaces are still missing |
| 5 | Build web admin client surfaces | Web | Backend admin module is ready and mobile is implemented; web user-facing admin workflows are pending |
| 6 | Add production hardening | Cross-cutting | Needed before scaling beyond MVP usage |

## 13. Execution Plan (Single Source of Truth)

| Order | Task | Area | Why |
| --- | --- | --- | --- |
| 1 | ✅ Complete user endpoints (`PATCH /users/me`, admin list/detail/role/status) | Backend | Completed and validated |
| 2 | ✅ Complete subject CRUD (`GET/:id`, create/update/delete) | Backend | Completed and validated |
| 3 | ✅ Build resources module (full lifecycle + storage) | Backend | Core product |
| 4 | ✅ Build downloads module | Backend | Completed and validated |
| 5 | ✅ Implement mobile subject + resource browsing | Mobile | Implemented and tested |
| 6 | ✅ Implement native download completion UX (open/download file from signed URL) | Mobile | Signed URLs now open natively with a clipboard fallback |
| 7 | Replace Next.js starter UI with landing/auth shell + API client bootstrap | Web | Home/landing surfaces are still missing |
| 8 | Build web admin client panel | Web | Backend admin APIs exist; web client integration is the remaining work |
| 9 | Add pagination, logging, monitoring | All | Production readiness |

## 14. Redesign Requirements Backlog

The current UI is acceptable for now and can continue in its current style.

When redesign work is scheduled, include these requirements:

| Area | Requirement | Priority |
| --- | --- | --- |
| Web landing | Build a proper landing/home experience (replace Next.js starter template) | High |
| Mobile home | Expand home from utility entry screen to role-aware dashboard sections (student/faculty/admin quick actions) | Medium |
| Download UX | Keep native open/download flow and improve fallback/error messaging for launch failures and expired links | Medium |
| Empty/error states | Keep current simple states, but add contextual actions (retry, back, open settings) | Medium |
| Design system | Consolidate colors/typography/components into a reusable token + component pattern across screens | Medium |
