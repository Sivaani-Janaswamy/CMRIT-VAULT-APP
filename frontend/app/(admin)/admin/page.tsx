import Link from "next/link";

import { AdminResourceActions } from "@/src/components/admin/admin-resource-actions";
import { AdminSearchReindexActions } from "@/src/components/admin/admin-search-reindex-actions";
import { AdminSubjectsManager } from "@/src/components/admin/admin-subjects-manager";
import { AdminUserActions } from "@/src/components/admin/admin-user-actions";
import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import {
  type AdminPeriod,
  fetchAdminDashboardSummary,
  fetchAdminDownloadsOverview,
  fetchAdminResourcesOverview,
  fetchAdminUsers,
} from "@/src/lib/api/admin";
import { fetchSubjects } from "@/src/lib/api/subjects";
import { requireSession } from "@/src/lib/auth/session";

interface AdminHomePageProps {
  searchParams: Promise<{
    period?: AdminPeriod;
    usersPage?: string;
    resourcesPage?: string;
    downloadsPage?: string;
    userRole?: "student" | "faculty" | "admin";
    resourceStatus?: string;
    downloadSource?: "mobile" | "web" | "admin";
  }>;
}

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const session = await requireSession(["admin"]);
  const params = await searchParams;

  const period = params.period ?? "30d";
  const usersPage = Number.parseInt(params.usersPage ?? "1", 10);
  const resourcesPage = Number.parseInt(params.resourcesPage ?? "1", 10);
  const downloadsPage = Number.parseInt(params.downloadsPage ?? "1", 10);
  const safeUsersPage = Number.isNaN(usersPage) || usersPage < 1 ? 1 : usersPage;
  const safeResourcesPage = Number.isNaN(resourcesPage) || resourcesPage < 1 ? 1 : resourcesPage;
  const safeDownloadsPage = Number.isNaN(downloadsPage) || downloadsPage < 1 ? 1 : downloadsPage;
  const userRole = params.userRole;
  const resourceStatus = params.resourceStatus;
  const downloadSource = params.downloadSource;

  let summary: Awaited<ReturnType<typeof fetchAdminDashboardSummary>> | null = null;
  let usersResult: Awaited<ReturnType<typeof fetchAdminUsers>> | null = null;
  let resourcesResult: Awaited<ReturnType<typeof fetchAdminResourcesOverview>> | null = null;
  let downloadsResult: Awaited<ReturnType<typeof fetchAdminDownloadsOverview>> | null = null;
  let subjects: Awaited<ReturnType<typeof fetchSubjects>> = [];
  let errorMessage: string | null = null;

  try {
    [summary, usersResult, resourcesResult, downloadsResult, subjects] = await Promise.all([
      fetchAdminDashboardSummary(session.accessToken, period),
      fetchAdminUsers(session.accessToken, { page: safeUsersPage, pageSize: 10, role: userRole }),
      fetchAdminResourcesOverview(session.accessToken, { page: safeResourcesPage, pageSize: 10, status: resourceStatus }),
      fetchAdminDownloadsOverview(session.accessToken, { page: safeDownloadsPage, pageSize: 10, source: downloadSource }),
      fetchSubjects(session.accessToken),
    ]);
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load admin workspace right now.";
  }

  if (!summary || !usersResult || !resourcesResult || !downloadsResult) {
    return (
      <PageShell title="Admin Workspace" subtitle="Admin dashboards and controls.">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage ?? "Unable to load admin workspace right now."}
        </div>
      </PageShell>
    );
  }

  const usersTotalPages = Math.max(1, Math.ceil(usersResult.total / usersResult.pageSize));
  const resourcesTotalPages = Math.max(1, Math.ceil(resourcesResult.total / resourcesResult.pageSize));
  const downloadsTotalPages = Math.max(1, Math.ceil(downloadsResult.total / downloadsResult.pageSize));

  const buildAdminHref = (overrides: Partial<Record<string, string>>) => {
    const query = new URLSearchParams();
    query.set("period", period);
    if (userRole) {
      query.set("userRole", userRole);
    }
    if (resourceStatus) {
      query.set("resourceStatus", resourceStatus);
    }
    if (downloadSource) {
      query.set("downloadSource", downloadSource);
    }
    if (safeUsersPage > 1) {
      query.set("usersPage", String(safeUsersPage));
    }
    if (safeResourcesPage > 1) {
      query.set("resourcesPage", String(safeResourcesPage));
    }
    if (safeDownloadsPage > 1) {
      query.set("downloadsPage", String(safeDownloadsPage));
    }

    Object.entries(overrides).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      } else {
        query.delete(key);
      }
    });

    return `/admin?${query.toString()}`;
  };

  return (
    <PageShell
      title="Admin Workspace"
      subtitle="Overview, moderation, and user controls."
    >
      <form action="/admin" aria-label="Admin dashboard period filter" className="mb-5 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--muted)]">Period</span>
          <select
            name="period"
            defaultValue={period}
            className="h-11 rounded-[12px] border border-[var(--primary)]/30 bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-11 rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
        >
          Apply
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Users</p>
          <p className="mt-2 text-2xl font-semibold">{summary.users.total}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Subjects</p>
          <p className="mt-2 text-2xl font-semibold">{summary.subjects.total}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Resources</p>
          <p className="mt-2 text-2xl font-semibold">{summary.resources.total}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Downloads</p>
          <p className="mt-2 text-2xl font-semibold">{summary.downloads.total}</p>
        </div>
      </div>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Users</h2>
          <form action="/admin" className="flex items-center gap-2">
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="resourcesPage" value={String(safeResourcesPage)} />
            <input type="hidden" name="downloadsPage" value={String(safeDownloadsPage)} />
            <select
              name="userRole"
              defaultValue={userRole ?? ""}
              aria-label="Filter users by role"
              className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="h-10 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 text-sm font-semibold text-white">
              Filter
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {usersResult.items.map((user) => (
            <article key={user.id} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{user.fullName}</h3>
                  <p className="text-xs text-[var(--muted)]">{user.email}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">{user.role} · {user.isActive ? "active" : "inactive"}</span>
              </div>
              <AdminUserActions userId={user.id} role={user.role} isActive={user.isActive} />
            </article>
          ))}

          {usersTotalPages > 1 ? (
            <div className="flex items-center gap-2 pt-2">
              {usersResult.page > 1 ? (
                <Link href={buildAdminHref({ usersPage: String(usersResult.page - 1) })} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">Previous</Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Previous</span>
              )}
              <p className="text-xs text-[var(--muted)]">Page {usersResult.page} of {usersTotalPages}</p>
              {usersResult.page < usersTotalPages ? (
                <Link href={buildAdminHref({ usersPage: String(usersResult.page + 1) })} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">Next</Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Next</span>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Resources Overview</h2>
          <form action="/admin" className="flex items-center gap-2">
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="userRole" value={userRole ?? ""} />
            <input type="hidden" name="usersPage" value={String(safeUsersPage)} />
            <input type="hidden" name="downloadsPage" value={String(safeDownloadsPage)} />
            <select
              name="resourceStatus"
              defaultValue={resourceStatus ?? ""}
              aria-label="Filter resources by status"
              className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
            <button type="submit" className="h-10 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 text-sm font-semibold text-white">
              Filter
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {resourcesResult.items.map((resource) => (
            <article key={resource.id} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{resource.title}</h3>
                  <p className="text-xs text-[var(--muted)]">{resource.resourceType} · {resource.status}</p>
                </div>
                <Link href={`/resources/${resource.id}`} className="text-xs font-semibold text-[var(--primary-strong)]">
                  Open
                </Link>
              </div>
              <AdminResourceActions resourceId={resource.id} />
              <div className="mt-2">
                <AdminSearchReindexActions resourceId={resource.id} />
              </div>
            </article>
          ))}

          {resourcesTotalPages > 1 ? (
            <div className="flex items-center gap-2 pt-2">
              {resourcesResult.page > 1 ? (
                <Link href={buildAdminHref({ resourcesPage: String(resourcesResult.page - 1) })} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">Previous</Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Previous</span>
              )}
              <p className="text-xs text-[var(--muted)]">Page {resourcesResult.page} of {resourcesTotalPages}</p>
              {resourcesResult.page < resourcesTotalPages ? (
                <Link href={buildAdminHref({ resourcesPage: String(resourcesResult.page + 1) })} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">Next</Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Next</span>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Search Reindex</h2>
          <AdminSearchReindexActions />
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Downloads Overview</h2>
          <form action="/admin" className="flex items-center gap-2">
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="userRole" value={userRole ?? ""} />
            <input type="hidden" name="resourceStatus" value={resourceStatus ?? ""} />
            <input type="hidden" name="usersPage" value={String(safeUsersPage)} />
            <input type="hidden" name="resourcesPage" value={String(safeResourcesPage)} />
            <select
              name="downloadSource"
              defaultValue={downloadSource ?? ""}
              aria-label="Filter downloads by source"
              className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
            >
              <option value="">All Sources</option>
              <option value="mobile">Mobile</option>
              <option value="web">Web</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="h-10 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 text-sm font-semibold text-white">
              Filter
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {downloadsResult.items.map((download) => (
            <article key={download.id} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
              <h3 className="text-sm font-semibold">{download.resourceTitle}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">Source: {download.source} · User: {download.userId}</p>
              <p className="text-xs text-[var(--muted)]">Resource: {download.resourceId}</p>
            </article>
          ))}

          {downloadsTotalPages > 1 ? (
            <div className="flex items-center gap-2 pt-2">
              {downloadsResult.page > 1 ? (
                <Link href={buildAdminHref({ downloadsPage: String(downloadsResult.page - 1) })} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">Previous</Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Previous</span>
              )}
              <p className="text-xs text-[var(--muted)]">Page {downloadsResult.page} of {downloadsTotalPages}</p>
              {downloadsResult.page < downloadsTotalPages ? (
                <Link href={buildAdminHref({ downloadsPage: String(downloadsResult.page + 1) })} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">Next</Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Next</span>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Subjects Management</h2>
        <AdminSubjectsManager subjects={subjects} />
      </section>
    </PageShell>
  );
}
