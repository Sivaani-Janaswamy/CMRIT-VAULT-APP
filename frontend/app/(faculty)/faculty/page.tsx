import Link from "next/link";

import { FacultyResourceActions } from "@/src/components/faculty/faculty-resource-actions";
import { FacultyResourceForm } from "@/src/components/faculty/faculty-resource-form";
import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import { type FacultyPeriod, fetchFacultyDashboardSummary, fetchFacultyResources } from "@/src/lib/api/faculty";
import { fetchResourceById, type ResourceType } from "@/src/lib/api/resources";
import { fetchSubjects } from "@/src/lib/api/subjects";
import { requireSession } from "@/src/lib/auth/session";

interface FacultyHomePageProps {
  searchParams: Promise<{
    period?: FacultyPeriod;
    page?: string;
    resourceType?: ResourceType;
    status?: "draft" | "pending_review" | "published" | "rejected" | "archived";
    editId?: string;
  }>;
}

function formatDate(input: string | null): string {
  if (!input) {
    return "-";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function FacultyHomePage({ searchParams }: FacultyHomePageProps) {
  const session = await requireSession(["faculty", "admin"]);
  const params = await searchParams;
  const period = params.period ?? "30d";
  const page = Number.parseInt(params.page ?? "1", 10);
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
  const resourceType = params.resourceType;
  const status = params.status;
  const editId = params.editId;

  let summary: Awaited<ReturnType<typeof fetchFacultyDashboardSummary>> | null = null;
  let resourcesResult: Awaited<ReturnType<typeof fetchFacultyResources>> | null = null;
  let editingResource: Awaited<ReturnType<typeof fetchResourceById>> | null = null;
  let subjects: Awaited<ReturnType<typeof fetchSubjects>> = [];
  let errorMessage: string | null = null;

  try {
    [summary, resourcesResult, subjects] = await Promise.all([
      fetchFacultyDashboardSummary(session.accessToken, period),
      fetchFacultyResources(session.accessToken, {
        page: safePage,
        pageSize: 20,
        resourceType,
        status,
      }),
      fetchSubjects(session.accessToken),
    ]);

    if (editId) {
      editingResource = await fetchResourceById(editId, session.accessToken);
    }
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load faculty dashboard right now.";
  }

  if (!summary || !resourcesResult) {
    return (
      <PageShell title="Faculty Workspace" subtitle="Faculty dashboard overview.">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage ?? "Unable to load faculty dashboard right now."}
        </div>
      </PageShell>
    );
  }

  const totalPages = Math.max(1, Math.ceil(resourcesResult.total / resourcesResult.pageSize));
  const buildFacultyPageHref = (targetPage: number) => {
    const query = new URLSearchParams();
    query.set("period", period);
    if (targetPage > 1) {
      query.set("page", String(targetPage));
    }
    if (resourceType) {
      query.set("resourceType", resourceType);
    }
    if (status) {
      query.set("status", status);
    }
    return `/faculty?${query.toString()}`;
  };

  return (
    <PageShell
      title="Faculty Workspace"
      subtitle="Summary of your resource lifecycle and downloads."
    >
      <form action="/faculty" aria-label="Faculty dashboard period filter" className="mb-5 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Resources (Total)</p>
          <p className="mt-2 text-2xl font-semibold">{summary.resources.total}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Downloads (Total)</p>
          <p className="mt-2 text-2xl font-semibold">{summary.downloads.total}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Downloads (In Period)</p>
          <p className="mt-2 text-2xl font-semibold">{summary.downloads.inPeriod}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <h2 className="text-sm font-semibold">Resource Status Breakdown</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p>Draft: <span className="font-semibold">{summary.resources.draft}</span></p>
            <p>Pending Review: <span className="font-semibold">{summary.resources.pendingReview}</span></p>
            <p>Published: <span className="font-semibold">{summary.resources.published}</span></p>
            <p>Rejected: <span className="font-semibold">{summary.resources.rejected}</span></p>
            <p>Archived: <span className="font-semibold">{summary.resources.archived}</span></p>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <h2 className="text-sm font-semibold">Download Source Breakdown</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <p>Mobile: <span className="font-semibold">{summary.downloads.bySource.mobile}</span></p>
            <p>Web: <span className="font-semibold">{summary.downloads.bySource.web}</span></p>
            <p>Admin: <span className="font-semibold">{summary.downloads.bySource.admin}</span></p>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Range: {formatDate(summary.startDate)} to {formatDate(summary.endDate)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/subjects"
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
        >
          Browse subjects
        </Link>
        <Link
          href="/search"
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
        >
          Search resources
        </Link>
      </div>

      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Faculty Resources</h2>
          <form action="/faculty" className="flex flex-wrap gap-2">
            <input type="hidden" name="period" value={period} />
            <select
              name="resourceType"
              defaultValue={resourceType ?? ""}
              aria-label="Filter faculty resources by type"
              className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="">All Types</option>
              <option value="note">Notes</option>
              <option value="question_paper">PYQs</option>
              <option value="faculty_upload">Faculty Uploads</option>
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              aria-label="Filter faculty resources by status"
              className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
            <button
              type="submit"
              className="h-10 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              Apply
            </button>
          </form>
        </div>

        <FacultyResourceForm subjects={subjects} initialResource={editingResource} />

        {resourcesResult.items.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
            No resources found for selected filters.
          </div>
        ) : (
          <div className="space-y-3">
            {resourcesResult.items.map((item) => (
              <article key={item.id} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-[var(--radius-pill)] bg-[var(--highlight-orange)]/35 px-2.5 py-1 text-xs font-semibold">
                    {item.resourceType}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{item.status}</span>
                </div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.description || item.fileName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/resources/${item.id}`}
                    className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)]"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/faculty/resources/${item.id}/stats`}
                    className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)]"
                  >
                    Stats
                  </Link>
                  <Link
                    href={`/faculty?period=${period}&resourceType=${resourceType ?? ""}&status=${status ?? ""}&editId=${item.id}`}
                    className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)]"
                  >
                    Edit
                  </Link>
                </div>
                <FacultyResourceActions resourceId={item.id} status={item.status} />
              </article>
            ))}

            {totalPages > 1 ? (
              <div className="flex items-center gap-2 pt-2">
                {resourcesResult.page > 1 ? (
                  <Link href={buildFacultyPageHref(resourcesResult.page - 1)} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Previous</span>
                )}
                <p className="text-xs text-[var(--muted)]">Page {resourcesResult.page} of {totalPages}</p>
                {resourcesResult.page < totalPages ? (
                  <Link href={buildFacultyPageHref(resourcesResult.page + 1)} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">
                    Next
                  </Link>
                ) : (
                  <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Next</span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </PageShell>
  );
}
