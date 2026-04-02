# IMPLEMENTATION INVENTORY

This document maps the current CMRIT Vault codebase against the planned architecture.

Legend:
- `✅` = exists and is usable
- `⚠️` = partially implemented or incomplete
- `❌` = missing

## 2. Backend Inventory

| Module | File/Folder | Exists? | Notes |
|---|---|---|---|
| App bootstrap | `backend/src/app.ts`, `backend/src/server.ts` | ✅ | Express app, middleware chain, health route |
| Config | `backend/src/config/env.ts` | ✅ | Env loading for Supabase URL and service role key |
| Supabase integration | `backend/src/integrations/supabase/client.ts` | ✅ | Service role client exists |
| Common errors | `backend/src/common/errors/*` | ✅ | AppError, Unauthorized, Forbidden, NotFound |
| Common middleware | `backend/src/common/middleware/*` | ✅ | Auth, validation, request logging, error handling, not found |
| Common types | `backend/src/common/types/*` | ✅ | User and authenticated request types |
| Common utils | `backend/src/common/utils/logger.ts` | ✅ | Debug logger exists |
| Auth module | `backend/src/modules/auth/*` | ✅ | Sync profile flow implemented |
| Users module | `backend/src/modules/users/*` | ✅ | `/v1/users/me` implemented |
| Subjects module | `backend/src/modules/subjects/*` | ✅ | Read-only subject listing implemented |
| Resources module | `backend/src/modules/resources/*` | ❌ | Not present |
| Downloads module | `backend/src/modules/downloads/*` | ❌ | Not present |
| Search module | `backend/src/modules/search/*` | ❌ | Not present |
| Admin module | `backend/src/modules/admin/*` | ❌ | Not present |
| Module router | `backend/src/modules/index.ts` | ✅ | Wires auth, users, subjects routers only |

## 3. API Endpoints

| Endpoint | Module | Implemented? | Notes |
|---|---|---|---|
| `POST /v1/auth/sync` | Auth | ✅ | Syncs Supabase user into local profile |
| `GET /v1/users/me` | Users | ✅ | Returns current user profile |
| `GET /v1/subjects` | Subjects | ✅ | Read-only subject list |
| `GET /health` | App bootstrap | ✅ | Health check route |
| `PATCH /v1/users/me` | Users | ❌ | Planned, not implemented |
| `GET /v1/admin/users` | Users/Admin | ❌ | Planned, not implemented |
| `PATCH /v1/admin/users/:id/role` | Users/Admin | ❌ | Planned, not implemented |
| `PATCH /v1/admin/users/:id/status` | Users/Admin | ❌ | Planned, not implemented |
| `GET /v1/subjects/:id` | Subjects | ❌ | Planned, not implemented |
| `POST /v1/admin/subjects` | Subjects/Admin | ❌ | Planned, not implemented |
| `PATCH /v1/admin/subjects/:id` | Subjects/Admin | ❌ | Planned, not implemented |
| `DELETE /v1/admin/subjects/:id` | Subjects/Admin | ❌ | Planned, not implemented |
| `GET /v1/resources` | Resources | ❌ | Missing module |
| `GET /v1/resources/:id` | Resources | ❌ | Missing module |
| `POST /v1/resources` | Resources | ❌ | Missing module |
| `PATCH /v1/resources/:id` | Resources | ❌ | Missing module |
| `POST /v1/resources/:id/complete` | Resources | ❌ | Missing module |
| `POST /v1/resources/:id/submit` | Resources | ❌ | Missing module |
| `DELETE /v1/resources/:id` | Resources | ❌ | Missing module |
| `POST /v1/resources/:id/download-url` | Resources/Downloads | ❌ | Missing module |
| `GET /v1/downloads/me` | Downloads | ❌ | Missing module |
| `GET /v1/admin/downloads` | Downloads/Admin | ❌ | Missing module |
| `GET /v1/search/resources` | Search | ❌ | Missing module |
| `GET /v1/search/suggest` | Search | ❌ | Missing module |
| `POST /v1/admin/search/reindex` | Search/Admin | ❌ | Missing module |
| `POST /v1/admin/search/resources/:id/reindex` | Search/Admin | ❌ | Missing module |
| `GET /v1/faculty/dashboard/summary` | Admin/Faculty | ❌ | Missing module |
| `GET /v1/faculty/resources` | Resources | ❌ | Missing module |
| `GET /v1/faculty/resources/:id/stats` | Resources | ❌ | Missing module |

## 4. Database Mapping

| Table | Repository | Exists? | Notes |
|---|---|---|---|
| `roles` | No dedicated repository | ⚠️ | Role lookups are handled indirectly in auth/users repositories |
| `users` | `backend/src/modules/auth/auth.repository.ts`, `backend/src/modules/users/users.repository.ts` | ✅ | Role resolution now uses `role_id` + `roles.code` |
| `subjects` | `backend/src/modules/subjects/subjects.repository.ts` | ✅ | Read-only repository only |
| `resources` | `backend/src/modules/resources/*` | ❌ | Missing |
| `downloads` | `backend/src/modules/downloads/*` | ❌ | Missing |
| `user_subject_access` | Not implemented | ❌ | Planned only |
| `audit_logs` | Not implemented | ❌ | Planned only |

## 5. Flutter Mobile

| Pages | API Used | Implemented? | Notes |
|---|---|---|---|
| Splash screen | Auth bootstrap/session check | ✅ | Shows loading/error state |
| Login screen | Supabase login + backend auth sync flow | ✅ | Minimal functional login UI |
| Sign up screen | Supabase signup + backend auth sync flow | ✅ | Minimal functional signup UI |
| Home screen | `/v1/users/me` via auth controller | ✅ | No blank screen; shows authenticated content and logout |
| Subject list | `/v1/subjects` | ❌ | Not implemented |
| Subject detail | `/v1/subjects/:id` | ❌ | Not implemented |
| Notes list/detail | `/v1/resources` | ❌ | Not implemented |
| Downloads history | `/v1/downloads/me` | ❌ | Not implemented |
| Search screen | `/v1/search/resources` | ❌ | Not implemented |
| Faculty dashboard | `/v1/faculty/*` | ❌ | Not implemented |
| Admin panel | `/v1/admin/*` | ❌ | Not implemented |

### Mobile Structure Status

| Area | Status | Notes |
|---|---|---|
| Riverpod state management | ✅ | Auth controller and providers exist |
| `go_router` navigation | ✅ | Splash -> Login -> Signup -> Home |
| Supabase bootstrap | ✅ | Initialized in app startup |
| Backend API client | ✅ | Thin HTTP wrapper exists |
| Feature-based structure | ⚠️ | Auth and home are organized; future features are still missing |

## 6. Frontend (Web)

| Screen | API Used | Implemented? | Notes |
|---|---|---|---|
| App shell | N/A | ⚠️ | Next.js App Router scaffold exists, but it still contains starter template content |
| Login | N/A | ❌ | Not implemented |
| Dashboard | N/A | ❌ | Not implemented |
| Notes browsing | N/A | ❌ | Not implemented |
| Search | N/A | ❌ | Not implemented |
| Admin panel | N/A | ❌ | Not implemented |

### Frontend Structure Status

| Area | Status | Notes |
|---|---|---|
| `frontend/` folder | ✅ | Folder exists with Next.js project scaffold |
| Next.js setup | ✅ | App Router scaffold is initialized |
| API integration layer | ❌ | Missing backend client, auth sync, and feature service layer |

## 7. Architectural Gaps

| Area | Problem | Impact | Recommendation |
|---|---|---|---|
| Resources module | Backend has no resources CRUD or signed URL flow | Core notes/question paper/faculty upload publishing cannot ship | Build `resources` module with repository/service/controller layers |
| Downloads module | Download logging and history are absent | No audit trail or usage analytics | Add `downloads` module and connect it to signed download flow |
| Search module | Algolia integration is missing | No fast discovery or subject-based search | Add search indexing sync after resource publish/update |
| Admin module | No admin operations or moderation APIs | No content governance or account management | Implement admin endpoints after MVP content flow |
| Web backend integration | Next.js exists but is still starter-only | Web cannot consume auth/profile APIs yet | Add typed backend client and auth bootstrap flow |
| Mobile content browsing | Flutter covers auth only | Users cannot browse content in app | Add subjects/resources/downloads screens and repositories |
| API contract coverage | Only auth/users/subjects are implemented | Endpoint surface is incomplete | Prioritize core content endpoints before UI expansion |

## 8. Technical Debt

| Area | Issue | Risk | Fix |
|---|---|---|---|
| Reference file name | `ARCHITECHURE.md` is misspelled relative to requested `ARCHITECTURE.md` | Confusion for future contributors | Standardize the file name in repo and docs |
| Mobile feature depth | Auth flow exists but feature modules stop at home | Feature growth becomes ad hoc | Add feature folders for subjects/resources/downloads/search |
| Web app state | Starter Next.js page still shows template content | Production confusion and weak brand identity | Replace starter page with CMRIT Vault app shell and auth-aware layout |
| Backend module surface | Missing resources/downloads/search/admin modules | Prevents MVP completion | Implement modules in the planned order |
| Shared API contracts | No shared API DTO package between mobile and web | Drift risk across clients | Introduce a stable response/types layer if needed later |
| Content lifecycle | Resources lifecycle is not in code yet | Upload/download/search cannot be end-to-end | Build resource state machine next |

## 9. Production Risks

| Risk | Area | Severity | Mitigation |
|---|---|---|---|
| Schema drift | Backend DB access | High | Keep code aligned to `DATABASE_DESIGN.md` and review queries against the schema |
| Starter frontend exposure | Web | Medium | Replace template UI before user-facing release |
| Missing download tracking | Backend | High | Implement downloads module before content launch |
| Missing search | Backend + frontend | Medium | Add Algolia indexing and search UI in phase 3 |
| Incomplete admin controls | Backend | Medium | Build moderation and user management before scaling to large usage |
| Auth bootstrap regressions | Mobile | High | Preserve loading/error states and keep auth sync idempotent |

## 10. Feature Completeness Matrix

| Feature | Backend | Mobile | Web | Status |
|---|---|---|---|---|
| Auth bootstrap | ✅ | ✅ | ⚠️ | Backend and mobile exist; web scaffold exists but auth pages missing |
| Users profile | ✅ | ✅ | ❌ | Web profile flow missing |
| Subjects browsing | ⚠️ | ❌ | ❌ | Backend list exists only |
| Resources lifecycle | ❌ | ❌ | ❌ | Not implemented yet |
| Downloads tracking | ❌ | ❌ | ❌ | Not implemented yet |
| Search | ❌ | ❌ | ❌ | Not implemented yet |
| Faculty dashboard | ❌ | ❌ | ❌ | Not implemented yet |
| Admin panel | ❌ | ❌ | ❌ | Not implemented yet |
| App shell / navigation | ✅ | ✅ | ⚠️ | Web has a starter App Router scaffold, but production navigation/auth routes are missing |

## 11. Roadmap

### Phase 1: Core MVP

| Item | Scope | Dependency |
|---|---|---|
| Auth | Already done | Supabase Auth + backend sync |
| Users | Complete missing endpoints | Auth + normalized role model |
| Subjects | Complete CRUD | Backend service/repository expansion |
| Resources module | Full lifecycle | Supabase Storage + DB schema + role checks |
| Downloads module | Logging and history | Resources + signed download URLs |

### Phase 2: Usability

| Item | Scope | Dependency |
|---|---|---|
| Mobile UI completion | Subjects, resources, downloads, search screens | Phase 1 APIs |
| Web UI pages | Next.js pages for auth/content browsing | Phase 1 APIs + backend client |
| Resource browsing + filtering | Subject, year, semester, type filters | Resources module |

### Phase 3: Advanced

| Item | Scope | Dependency |
|---|---|---|
| Search | Algolia indexing and query endpoints | Resources metadata stability |
| Faculty dashboard | Upload oversight and status management | Resources module |
| Admin panel | User moderation and analytics | Users/resources/downloads modules |

### Phase 4: Production Hardening

| Item | Scope | Dependency |
|---|---|---|
| Pagination | Cursor-based pagination everywhere | List endpoints |
| Caching | Stable metadata caching on client/API | Usage patterns |
| Rate limiting | Abuse prevention for auth/search endpoints | API gateway or middleware |
| Logging improvements | Structured request/error logs | Shared logging standards |
| Monitoring | Metrics, traces, alerts, startup health | Deployment environment |

## 12. Suggested Folder Structure (Final Form)

### Backend

| Layer | Suggested Structure |
|---|---|
| Entry | `src/app.ts`, `src/server.ts` |
| Config | `src/config/*` |
| Common | `src/common/errors`, `src/common/middleware`, `src/common/utils`, `src/common/types` |
| Integrations | `src/integrations/supabase`, `src/integrations/algolia` |
| Modules | `src/modules/auth`, `src/modules/users`, `src/modules/subjects`, `src/modules/resources`, `src/modules/downloads`, `src/modules/search`, `src/modules/admin` |
| Tests | `tests/` or module-local tests |

### Mobile (Flutter)

| Layer | Suggested Structure |
|---|---|
| App | `lib/app/*` |
| Core | `lib/core/*` |
| Features | `lib/features/auth`, `lib/features/home`, `lib/features/subjects`, `lib/features/notes`, `lib/features/downloads`, `lib/features/faculty`, `lib/features/admin`, `lib/features/search` |
| State | Riverpod |
| Routing | `go_router` |
| Data | Feature repositories and thin API services |

### Web (Next.js)

| Layer | Suggested Structure |
|---|---|
| App Router | `frontend/app/*` |
| Feature modules | `frontend/src/features/*` |
| API layer | `frontend/src/lib/api/*` |
| Auth | `frontend/src/lib/auth/*` |
| Shared UI | `frontend/src/components/*` |
| State | Server components plus local feature state where needed |

## 13. Top Priority Action Items

| Priority | Task | Area | Why it matters |
|---|---|---|---|
| 1 | Implement resources module | Backend | Core content publishing and browsing depend on it |
| 2 | Implement downloads module | Backend | Needed for tracking, history, and compliance |
| 3 | Complete subject CRUD | Backend | Needed for full admin/content management |
| 4 | Replace Next.js starter page | Web | Current UI is only template content |
| 5 | Add web backend client and auth flow | Web | Required for future production use |
| 6 | Add content browsing screens to mobile | Mobile | Mobile app is auth-only right now |
| 7 | Add search module after resources | Backend | Search depends on stable resource metadata |
| 8 | Add admin module | Backend + Web | Needed for moderation and operational control |
| 9 | Add production hardening | Cross-cutting | Needed before scaling beyond MVP usage |

## 14. NEXT IMPLEMENTATION ORDER

| Order | Task | Module | Reason |
|---|---|---|---|
| 1 | Complete user management endpoints (`PATCH /v1/users/me`, admin role/status endpoints) | `backend/users` | Role-aware profile updates are needed before content workflows expand |
| 2 | Implement resources lifecycle endpoints and storage flow | `backend/resources` | Core notes/question paper/faculty upload workflow is the main product surface |
| 3 | Implement download tracking and history endpoints | `backend/downloads` | Downloads are required for auditability and user history |
| 4 | Replace the starter Next.js page with CMRIT Vault app shell | `frontend` | Web is initialized already, but it still shows template content |
| 5 | Add a typed backend API client and auth bootstrap in Next.js | `frontend` | Web must consume the same auth/profile APIs as mobile |
| 6 | Add subject and resource browsing screens in Flutter | `mobile` | Mobile currently covers auth only and needs content browsing next |
| 7 | Add search indexing and query endpoints | `backend/search` | Search depends on stable resource metadata |
| 8 | Add faculty dashboard views and moderation endpoints | `backend/admin`, `frontend`, `mobile` | Faculty workflows need upload/status oversight in both clients |
| 9 | Add production hardening for pagination, logging, and monitoring | `backend`, `mobile`, `frontend` | Needed before scale or wider deployment |
| 2 | Complete subject CRUD endpoints (`GET /:id`, create/update/delete) | `backend/subjects` | Subject management must be complete before content relationships expand |
| 3 | Build the resources module end-to-end | `backend/resources` | Core notes/question paper/faculty upload workflow depends on this module |
| 4 | Build the downloads module end-to-end | `backend/downloads` | Download logging and history depend on resource access flow |
| 5 | Replace the Next.js starter page with a CMRIT Vault app shell | `frontend/app` | The web project is initialized and should stop showing template content |
| 6 | Add the Next.js backend API layer and auth-aware routing | `frontend` | Web needs typed API access and session-based navigation to consume backend APIs |
| 7 | Add mobile subject and resource browsing screens | `mobile/features` | Mobile is auth-ready but content browsing is still absent |
| 8 | Add mobile downloads history and resource detail flow | `mobile/features` | Completes the primary student workflow on mobile |
| 9 | Add Algolia search sync and search endpoints | `backend/search` | Search depends on stable resource metadata and publishing flow |
| 10 | Add faculty dashboard and moderation APIs | `backend/admin`, `backend/resources` | Faculty operations require resource lifecycle and moderation support |
| 11 | Add admin panel flows in web and mobile | `frontend`, `mobile` | Admin functionality should follow stable backend moderation APIs |
| 12 | Add production hardening (pagination, caching, rate limiting, monitoring) | Cross-cutting | Needed before scaling beyond MVP usage |

## 7. Production-Ready Target Structure

### Backend (Node.js)

| Layer | Suggested Structure |
|---|---|
| Entry | `src/app.ts`, `src/server.ts` |
| Config | `src/config/*` |
| Integrations | `src/integrations/supabase`, `src/integrations/algolia` |
| Common | `src/common/errors`, `src/common/middleware`, `src/common/utils`, `src/common/types` |
| Modules | `src/modules/auth`, `src/modules/users`, `src/modules/subjects`, `src/modules/resources`, `src/modules/downloads`, `src/modules/search`, `src/modules/admin` |
| Tests | `tests/` or module-local tests |

### Backend Module Boundaries

| Module | Ownership |
|---|---|
| Controller | HTTP entry points only |
| Service | Business rules, authorization, orchestration |
| Repository | DB access only |
| Integration | External service clients and adapters |

### Backend Middleware

| Middleware | Purpose |
|---|---|
| Auth | Verify Supabase JWT and attach user context |
| Validation | Validate request bodies and params |
| Request logging | Capture request metadata and endpoint hits |
| Error handling | Normalize errors into API responses |
| Not found | Return 404 for missing routes |

### Frontend (Next.js)

| Layer | Suggested Structure |
|---|---|
| App router | `app/` with route groups |
| Features | `src/features/*` or `app/(features)/*` |
| API client | `src/lib/api` |
| Auth | Supabase session handling + backend profile fetch |
| State | Lightweight server-state plus feature-level UI state |

### Mobile (Flutter)

| Area | Suggested Structure |
|---|---|
| App bootstrap | `lib/app/*` |
| Core | `lib/core/*` |
| Features | `lib/features/auth`, `lib/features/home`, `lib/features/subjects`, `lib/features/notes`, `lib/features/downloads`, `lib/features/faculty`, `lib/features/admin`, `lib/features/search` |
| State management | Riverpod |
| Routing | `go_router` |
| API integration | Repository/service layer with one thin HTTP client |

### DevOps / Infra

| Area | Recommendation |
|---|---|
| Environment handling | `.env` locally, secret manager in production |
| Deployment | Separate deploys for backend, mobile release, and future frontend |
| Logging | Structured logs with sensitive data excluded |
| Monitoring | Error tracking, request traces, startup health checks |
| Security | Private storage, JWT auth, service role only on backend |

## 8. Critical Gaps to Build Next

| Priority | Gap | Impact |
|---|---|---|
| High | Resources module | Core content workflow is missing |
| High | Downloads module | Download tracking and history are missing |
| High | Search module | Algolia search is missing |
| High | Admin module | Moderation and operational tools are missing |
| Medium | Frontend scaffold | Starter scaffold exists, but no CMRIT Vault pages yet |
| Medium | Subject detail endpoints | Current subject module is list-only |
| Medium | User profile update/admin endpoints | User management is incomplete |

## 9. Current Project Health

| Area | Status |
|---|---|
| Backend foundation | ✅ |
| Auth bootstrap end-to-end | ✅ |
| Role/schema alignment | ✅ |
| Subjects MVP | ✅ |
| Resources MVP | ❌ |
| Downloads MVP | ❌ |
| Search MVP | ❌ |
| Admin MVP | ❌ |
| Mobile auth shell | ✅ |
| Mobile content browsing | ❌ |
| Web frontend | ⚠️ |
