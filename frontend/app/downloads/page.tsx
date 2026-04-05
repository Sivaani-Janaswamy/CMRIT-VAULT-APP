import Link from "next/link";

import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import { fetchMyDownloads } from "@/src/lib/api/downloads";
import { fetchSubjects } from "@/src/lib/api/subjects";
import { requireSession } from "@/src/lib/auth/session";

interface DownloadsPageProps {
  searchParams: Promise<{
    page?: string;
    resourceType?: "note" | "question_paper" | "faculty_upload";
    resourceTitle?: string;
    subjectTitle?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatType(type: "note" | "question_paper" | "faculty_upload"): string {
  if (type === "question_paper") {
    return "PYQ";
  }
  if (type === "faculty_upload") {
    return "Faculty Upload";
  }
  return "Note";
}

export default async function DownloadsPage({ searchParams }: DownloadsPageProps) {
  const session = await requireSession(["student", "faculty", "admin"]);
  const filters = await searchParams;
  const resourceTitleQuery = filters.resourceTitle?.trim().toLowerCase() ?? "";
  const subjectTitleQuery = filters.subjectTitle?.trim().toLowerCase() ?? "";
  const page = Number.parseInt(filters.page ?? "1", 10);
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

  let result: Awaited<ReturnType<typeof fetchMyDownloads>> | null = null;
  let subjects: Awaited<ReturnType<typeof fetchSubjects>> = [];
  let errorMessage: string | null = null;

  try {
    [result, subjects] = await Promise.all([
      fetchMyDownloads(session.accessToken, {
        page: safePage,
        pageSize: 20,
        resourceType: filters.resourceType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
      fetchSubjects(session.accessToken),
    ]);
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load downloads history right now.";
  }

  if (!result) {
    return (
      <PageShell title="Downloads" subtitle="Track your recently downloaded resources.">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage ?? "Unable to load downloads history right now."}
        </div>
      </PageShell>
    );
  }

  const subjectNameById = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const filteredItems = result.items.filter((item) => {
    const subjectTitle = (subjectNameById.get(item.subjectId) ?? "Unknown subject").toLowerCase();
    const matchesResource = resourceTitleQuery ? item.resourceTitle.toLowerCase().includes(resourceTitleQuery) : true;
    const matchesSubject = subjectTitleQuery ? subjectTitle.includes(subjectTitleQuery) : true;
    return matchesResource && matchesSubject;
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const hasPrev = result.page > 1;
  const hasNext = result.page < totalPages;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    if (filters.resourceType) {
      params.set("resourceType", filters.resourceType);
    }
    if (filters.resourceTitle) {
      params.set("resourceTitle", filters.resourceTitle);
    }
    if (filters.subjectTitle) {
      params.set("subjectTitle", filters.subjectTitle);
    }
    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    return params.toString() ? `/downloads?${params.toString()}` : "/downloads";
  };

  return (
    <PageShell title="Downloads" subtitle="Track your recently downloaded resources.">
      <form action="/downloads" aria-label="Downloads filters" className="mb-5 space-y-3 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative block">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--muted)]">Type</span>
            <select
              name="resourceType"
              defaultValue={filters.resourceType ?? ""}
              className="h-11 min-w-0 w-full appearance-none rounded-[12px] border border-[var(--primary)]/30 bg-[var(--surface-soft)] px-3 pr-10 text-sm font-medium outline-none transition focus:border-[var(--primary)]"
            >
              <option value="">All Resource Types</option>
              <option value="note">Notes</option>
              <option value="question_paper">PYQs</option>
              <option value="faculty_upload">Faculty Uploads</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-[34px] text-xs text-[var(--muted)]">▼</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--muted)]">Resource Title</span>
            <input
              type="text"
              name="resourceTitle"
              defaultValue={filters.resourceTitle ?? ""}
              placeholder="Search by resource title"
              className="h-11 min-w-0 w-full rounded-[12px] border border-[var(--primary)]/30 bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--muted)]">Subject Title</span>
            <input
              type="text"
              name="subjectTitle"
              defaultValue={filters.subjectTitle ?? ""}
              placeholder="Search by subject title"
              className="h-11 min-w-0 w-full rounded-[12px] border border-[var(--primary)]/30 bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--muted)]">From Date</span>
            <input
              type="date"
              name="startDate"
              defaultValue={filters.startDate ?? ""}
              className="h-11 min-w-0 w-full rounded-[12px] border border-[var(--primary)]/30 bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--muted)]">To Date</span>
            <input
              type="date"
              name="endDate"
              defaultValue={filters.endDate ?? ""}
              className="h-11 min-w-0 w-full rounded-[12px] border border-[var(--primary)]/30 bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
            />
          </label>
          <button
            type="submit"
            aria-label="Apply downloads filters"
            className="mt-5 h-11 rounded-[var(--radius-pill)] border border-[var(--primary)] bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            Apply
          </button>
        </div>
      </form>

      {filteredItems.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
          No downloads found for the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">{result.total} download records</p>
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--radius-pill)] bg-[var(--highlight-orange)]/35 px-2.5 py-1 text-xs font-semibold">
                  {formatType(item.resourceType)}
                </span>
                <span className="text-xs text-[var(--muted)]">{item.source.toUpperCase()}</span>
              </div>
              <h3 className="text-base font-semibold">{item.resourceTitle}</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">Subject: {subjectNameById.get(item.subjectId) ?? "Unknown subject"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Downloaded at {formatDate(item.downloadedAt)}</p>
              <div className="mt-3">
                <Link
                  href={`/resources/${item.resourceId}`}
                  className="inline-flex rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)]"
                >
                  Open resource
                </Link>
              </div>
            </article>
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center gap-2 pt-2">
              {hasPrev ? (
                <Link href={buildPageHref(result.page - 1)} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">
                  Previous
                </Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Previous</span>
              )}
              <p className="text-xs text-[var(--muted)]">Page {result.page} of {totalPages}</p>
              {hasNext ? (
                <Link href={buildPageHref(result.page + 1)} className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold">
                  Next
                </Link>
              ) : (
                <span className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold opacity-60">Next</span>
              )}
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
