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
| App shell | N/A | ❌ | No Next.js scaffold in repo |
| Login | N/A | ❌ | Not implemented |
| Dashboard | N/A | ❌ | Not implemented |
| Notes browsing | N/A | ❌ | Not implemented |
| Search | N/A | ❌ | Not implemented |
| Admin panel | N/A | ❌ | Not implemented |

### Frontend Structure Status

| Area | Status | Notes |
|---|---|---|
| `frontend/` folder | ⚠️ | Folder exists, but no app source/package scaffold was found |
| Next.js setup | ❌ | Missing |
| API integration layer | ❌ | Missing |

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
| Medium | Frontend scaffold | No web app exists yet |
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
| Web frontend | ❌ |

