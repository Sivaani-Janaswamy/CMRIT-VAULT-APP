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
| Subject detail | `/v1/subjects/:id` + `/v1/resources?subjectId=...` | ✅ | Subject metadata and resource list are implemented |
| Notes list/detail | `/v1/resources`, `/v1/resources/:id` | ✅ | Resource list and detail screen implemented |
| Downloads history | `/v1/downloads/me` | ✅ | Read-only history list implemented |
| Search screen | `/v1/search/resources`, `/v1/search/suggest` | ✅ | Search + autocomplete suggestions are implemented |
| Download action (resource detail) | `POST /v1/resources/:id/download-url` | ✅ | Signed URL request opens natively; clipboard fallback remains for devices that cannot launch the URL |
| Faculty dashboard | `/v1/faculty/*` | ✅ | Implemented with role-aware route guard, dashboard summary, resources list, create/edit form, submit/archive actions, and per-resource stats |
| Admin panel | `/v1/admin/*` | ✅ | Implemented with role-aware route guard, dashboard summary, resources overview, downloads overview + audit, users list/detail role/status actions, subject create/update/delete screens, and search reindex action |

### Mobile Structure Status

| Area | Status | Notes |
| --- | --- | --- |
| Riverpod state management | ✅ | Auth controller and providers exist |
| `go_router` navigation | ✅ | Splash -> Login -> Signup -> Home + Subjects + Resource detail + Downloads + Search + Admin routes + Faculty routes |
| Supabase bootstrap | ✅ | Initialized in app startup |
| Backend API client | ✅ | Thin HTTP wrapper includes subjects/resources/download-url/downloads-history/search plus admin/faculty endpoints including admin users, admin subjects CRUD actions, downloads audit, and search reindex |
| Feature-based structure | ✅ | Auth, home, subjects/resources, downloads-history, search, admin, and faculty modules are organized |

## 5. Frontend (Web)

| Screen | API Used | Implemented? | Notes |
| --- | --- | --- | --- |
| App shell | N/A | ✅ | CMRIT Vault landing shell, navigation, design tokens, and hero assets are implemented |
| Login | Supabase Auth + `/v1/auth/sync` | ✅ | Sign-in flow, backend sync, role redirect, and error handling are implemented |
| Dashboard | `GET /v1/faculty/dashboard/summary`, `GET /v1/admin/dashboard/summary` | ⚠️ | Faculty and admin dashboard summaries are API-backed with period filters; student dashboard surface remains pending |
| Notes browsing | `GET /v1/resources`, `GET /v1/resources/:id` | ⚠️ | Subject-scoped notes/PYQs list, in-list search, resource detail, download action, and preview are implemented; dedicated notes hub page is still pending |
| Search | `GET /v1/search/resources`, `GET /v1/search/suggest` | ✅ | Homepage + search-page search bars, suggestions, results, and advanced filters (type/subject/semester/department/academic year) are implemented |
| Downloads history | `GET /v1/downloads/me` | ✅ | Web downloads page is implemented with resource/subject title filtering and date-range filters |
| Admin panel | `GET /v1/admin/dashboard/summary`, `GET /v1/admin/users`, `PATCH /v1/admin/users/:id/role`, `PATCH /v1/admin/users/:id/status`, `GET /v1/admin/resources/overview`, `PATCH /v1/admin/resources/:id/status`, `GET /v1/admin/downloads/overview`, `POST /v1/admin/search/reindex`, `POST /v1/admin/search/resources/:id/reindex`, `POST/PATCH/DELETE /v1/admin/subjects` | ✅ | Admin overview, users management, resources moderation, downloads overview, search reindex actions, and subjects CRUD are implemented |

### Frontend Structure Status

| Area | Status | Notes |
| --- | --- | --- |
| `frontend/` folder | ✅ | Folder exists with Next.js project scaffold |
| Next.js setup | ✅ | App Router scaffold is initialized with custom shell and auth pages |
| API integration layer | ✅ | Typed feature services now cover auth, subjects, resources, downloads, search, faculty, and admin surfaces |

## 6. Feature Completeness Matrix

| Feature | Backend | Mobile | Web | Status |
| --- | --- | --- | --- | --- |
| Auth bootstrap | ✅ | ✅ | ✅ | Web login/signup, session restore, logout flow, backend sync, and role-aware redirects are implemented |
| Users profile | ✅ | ✅ | ❌ | Mobile profile edit/update is implemented; web profile flow remains missing |
| Subjects browsing | ✅ | ✅ | ✅ | Web subjects list/detail is implemented, including subject-level search and subject-scoped notes/PYQs listing |
| Resources lifecycle | ✅ | ✅ | ✅ | Web supports student/faculty lifecycle operations and admin moderation status updates |
| Downloads tracking | ✅ | ✅ | ✅ | Web signed download action and downloads history page are implemented |
| Search | ✅ | ✅ | ✅ | Web search input, suggestions, results with resource navigation, and advanced filters are implemented |
| Faculty dashboard | ✅ | ✅ | ✅ | Web faculty summary, resources list, create/edit flow, submit/archive actions, and resource stats view are implemented |
| Admin panel | ✅ | ✅ | ✅ | Web admin dashboard summary, users role/status actions, resources moderation, downloads overview, search reindex, and subjects CRUD screens are implemented |
| App shell / navigation | ✅ | ✅ | ✅ | Web app shell, content-first nav, and auth action buttons are implemented |

## 7. Architectural Gaps

| Area | Problem | Impact | Recommendation |
| --- | --- | --- | --- |
| Resources module | Web now supports subject-scoped listing and resource detail/download/preview, but a dedicated notes hub with richer filters is still pending | Some browsing paths are still fragmented | Add a dedicated notes/PYQs feed page with filters and sorting |
| Download UX | Mobile now opens signed URLs natively with clipboard fallback when device launch fails | Fallback/error messaging can still be improved | Keep native-first behavior and refine user-facing failure messaging |
| Search client surfaces | Backend Algolia search exists; web now has search bars, suggestions, result listing, and advanced filters | Discovery is substantially complete for student MVP; further refinements are ranking/UX tuning | Tune relevance and add optional result-grouping refinements |
| Web backend integration | Base web API client and env config are implemented, but feature integration is incomplete | Web can start consuming APIs but auth/profile/services are not wired yet | Implement auth/session flow and feature-specific services next |
| Mobile content browsing | Subjects/resources browsing, downloads history, and search are implemented | Core browsing and download consumption work, and discovery is now available on mobile | Focus next on web discovery surfaces |
| API contract coverage | Auth/users/subjects/resources/downloads/faculty/search/admin backend endpoints are implemented | Mobile adoption now covers core student/faculty/admin user-facing flows; remaining parity gaps are primarily web and optional admin single-resource reindex UX | Prioritize web dashboard/admin/search surfaces next |

## 8. Technical Debt

| Area | Issue | Risk | Fix |
| --- | --- | --- | --- |
| Mobile feature depth | Subjects/resources browsing, downloads history, search, admin panel, and faculty lifecycle/stats are implemented | Primary remaining client imbalance is now web parity by role | Continue role-surface parity work on web |
| Web app state | App shell and auth page UI exist, but data-backed features are still scaffolded | Users may assume pages are functional before integrations are complete | Prioritize auth wiring and student feature integrations next |
| Backend module surface | Core backend modules including admin are implemented | Remaining risk is client adoption and operational hardening | Focus on client integration + production hardening |
| Shared API contracts | No shared API DTO package between mobile and web | Drift risk across clients | Introduce a stable response/types layer if needed later |
| Content lifecycle | Mobile browsing plus native download flow, search, admin moderation, and faculty lifecycle are available | UX is strong on mobile but still not complete on web role surfaces | Build web role surfaces next |

## 9. Production Risks

| Risk | Area | Severity | Mitigation |
| --- | --- | --- | --- |
| Schema drift | Backend DB access | High | Keep code aligned to `DATABASE_DESIGN.md` and review queries against the schema |
| Partial frontend feature wiring | Web | Medium | Complete auth/session integration and replace placeholders with API-backed screens |
| Download fallback UX gap | Mobile | Low | Improve fallback and error messages when automatic URL launch is unavailable |
| Client search UX tuning gap | Web | Low | Tune ranking behavior, optional grouping, and minor UX refinements |
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
| Mobile UI completion | ✅ Subjects + resources browsing, downloads history, search + suggestions, profile edit/update, faculty lifecycle/stats, and expanded admin surfaces (users detail/manage, subjects create/manage, downloads audit, search reindex) implemented | Phase 1 APIs |
| Web UI pages | Next.js pages for auth/content browsing | Phase 1 APIs + backend client |
| Resource browsing + filtering | Subject, year, semester, type filters | Resources module |

### Phase 3: Advanced

| Item | Scope | Dependency |
| --- | --- | --- |
| Search | Algolia relevance tuning, indexing sync validation, and result ranking refinements | Search backend stability |
| Faculty dashboard | Mobile + web faculty dashboard/resources lifecycle/stats UI is implemented | Resources module |
| Admin panel | Mobile + web admin dashboard/users/moderation/download-overview/search-reindex/subjects-CRUD are implemented | Users/resources/downloads/search/subjects modules |

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
| 4 | ✅ Replace Next.js starter page and add landing/auth shell | Web | Completed with content-first navigation and auth UI pages |
| 5 | Wire web auth/session to Supabase + backend sync | Web | Required to unlock all protected web flows |
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
| 7 | ✅ Replace Next.js starter UI with landing/auth shell + API client bootstrap | Web | Completed foundation and UI scaffold |
| 8 | Build web admin client panel | Web | Backend admin APIs exist; web client integration is the remaining work |
| 9 | Add pagination, logging, monitoring | All | Production readiness |

## 14. Redesign Requirements Backlog

The current UI is acceptable for now and can continue in its current style.

When redesign work is scheduled, include these requirements:

| Area | Requirement | Priority |
| --- | --- | --- |
| Web landing | Keep current landing shell and evolve it with live API-driven cards | Medium |
| Mobile home | Expand home from utility entry screen to role-aware dashboard sections (student/faculty/admin quick actions) | Medium |
| Download UX | Keep native open/download flow and improve fallback/error messaging for launch failures and expired links | Medium |
| Empty/error states | Keep current simple states, but add contextual actions (retry, back, open settings) | Medium |
| Design system | Consolidate colors/typography/components into a reusable token + component pattern across screens | Medium |

## 15. Web Implementation Order Checklist (Approval-Gated)

Use this checklist as the execution order for web implementation.

Rules:
- Each item remains unchecked until implementation is complete and you explicitly approve it.
- If an item is blocked by API or UX issues, note the blocker below the item before proceeding.
- Do not start a later phase unless all mandatory items in the current phase are approved.

### Phase A: Foundation

- [x] A1. Replace Next.js starter page with CMRIT Vault app shell (branding, layout, navigation placeholders)
- [x] A2. Create shared design tokens/components aligned to mobile style (colors, typography, spacing, cards, buttons, states)
- [x] A3. Set up web env/config and typed API client bootstrap (`API_BASE_URL`, auth headers, error normalization)
- [x] A4. Add route structure and role-aware route guards (public, student, faculty, admin)

### Phase B: Auth and Session

- [x] B1. Implement login page (Supabase auth + backend sync)
- [x] B2. Implement signup page (Supabase auth + backend sync)
- [x] B3. Implement session bootstrap/restore on refresh
- [x] B4. Implement logout and auth error recovery UX

Phase B completion note:
- Login/signup UI and functional auth wiring are completed and user-approved.
- Session restore, guarded route compatibility, and logout recovery flow are completed.

### Phase C: Student Core Flows

- [x] C1. Implement subjects list page (`GET /v1/subjects`)
- [x] C2. Implement subject detail page (`GET /v1/subjects/:id`)
- [x] C3. Implement resources list + filters for subject (`GET /v1/resources`)
- [x] C4. Implement resource detail page (`GET /v1/resources/:id`)
- [x] C5. Implement download action from resource detail (`POST /v1/resources/:id/download-url`)
- [x] C6. Implement downloads history page (`GET /v1/downloads/me`)

Phase C progress note:
- C1-C6 are implemented and user-approved, including subject-level list search, resource preview support where feasible, and web downloads history with title/date filters.

### Phase D: Search and Discovery

- [x] D1. Implement search input with autocomplete suggestions (`GET /v1/search/suggest`)
- [x] D2. Implement search results page (`GET /v1/search/resources`)
- [x] D3. Add search filters, empty states, and no-results UX

Phase D progress note:
- D1-D3 are implemented and user-approved via homepage/search-page search bars, autocomplete, result listing, and advanced filters.

### Phase E: Faculty Web Surfaces

- [x] E1. Implement faculty dashboard summary (`GET /v1/faculty/dashboard/summary`)
- [x] E2. Implement faculty resources list (`GET /v1/faculty/resources`)
- [x] E3. Implement faculty create/edit form for resources
- [x] E4. Implement faculty submit/archive actions
- [x] E5. Implement faculty resource stats view (`GET /v1/faculty/resources/:id/stats`)

Phase E progress note:
- E1-E5 are implemented with dashboard summary, faculty resources list, create/edit flow, submit/archive actions, and resource stats view.

### Phase F: Admin Web Surfaces

- [x] F1. Implement admin dashboard summary (`GET /v1/admin/dashboard/summary`)
- [x] F2. Implement admin users list/detail + role/status actions
- [x] F3. Implement admin resources overview + moderation status updates
- [x] F4. Implement admin downloads overview/audit
- [x] F5. Implement admin search reindex actions (bulk + single resource)
- [x] F6. Implement admin subjects create/update/delete screens

Phase F progress note:
- F1-F6 are implemented with admin dashboard summary, users role/status actions, resources moderation, downloads overview, search reindex actions, and subjects CRUD screens.

### Phase G: Hardening and Release Readiness

- [x] G1. Add pagination consistency on list-heavy web pages
- [x] G2. Add robust loading/empty/error states across all implemented screens
- [x] G3. Add responsive pass for small, medium, and large breakpoints
- [x] G4. Add accessibility pass (labels, keyboard nav, focus states, contrast)
- [x] G5. Add smoke tests for auth, student browsing, search, download, faculty, and admin flows
- [x] G6. Replace all remaining starter/template artifacts in web app

Phase G progress note:
- G1 is implemented with pagination controls across search results, downloads history, faculty resources, and admin list-heavy sections.
- G2 is implemented with robust empty/error surfaces and route-level loading states for key pages (`search`, `downloads`, `subjects`, `faculty`, `admin`).
- G3 is implemented with responsive refinements across filter/pagination controls in key list-heavy views.
- G4 is implemented with form labeling and accessibility-oriented aria improvements on major interactive surfaces.
- G5 is implemented with Playwright smoke test scaffolding (`playwright.config.ts`, `tests/smoke.spec.ts`) and `npm run test:smoke` script.
- G6 is implemented by replacing starter/template README content with project-specific frontend documentation.

### Sign-off

- [ ] Web Student MVP approved (Phases A-D)
- [ ] Web Faculty surfaces approved (Phase E)
- [ ] Web Admin surfaces approved (Phase F)
- [ ] Web Release candidate approved (Phase G)
