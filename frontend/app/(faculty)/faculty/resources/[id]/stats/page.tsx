import Link from "next/link";

import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import { fetchFacultyResourceStats } from "@/src/lib/api/faculty";
import { requireSession } from "@/src/lib/auth/session";

interface FacultyResourceStatsPageProps {
  params: Promise<{
    id: string;
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

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FacultyResourceStatsPage({ params }: FacultyResourceStatsPageProps) {
  const session = await requireSession(["faculty", "admin"]);
  const { id } = await params;

  let stats: Awaited<ReturnType<typeof fetchFacultyResourceStats>> | null = null;
  let errorMessage: string | null = null;

  try {
    stats = await fetchFacultyResourceStats(session.accessToken, id);
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load resource stats right now.";
  }

  if (!stats) {
    return (
      <PageShell title="Resource Stats" subtitle="Faculty resource analytics">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage ?? "Unable to load resource stats right now."}
        </div>
        <div className="mt-4">
          <Link
            href="/faculty"
            className="inline-flex rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
          >
            Back to faculty workspace
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Resource Stats" subtitle={stats.resource.title}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Total Downloads</p>
          <p className="mt-2 text-2xl font-semibold">{stats.downloads.total}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">First Download</p>
          <p className="mt-2 text-sm font-semibold">{formatDate(stats.downloads.firstDownloadedAt)}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Latest Download</p>
          <p className="mt-2 text-sm font-semibold">{formatDate(stats.downloads.lastDownloadedAt)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
        <h2 className="text-sm font-semibold">Downloads by Source</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <p className="text-sm">Mobile: <span className="font-semibold">{stats.downloads.bySource.mobile}</span></p>
          <p className="text-sm">Web: <span className="font-semibold">{stats.downloads.bySource.web}</span></p>
          <p className="text-sm">Admin: <span className="font-semibold">{stats.downloads.bySource.admin}</span></p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/resources/${stats.resource.id}`}
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
        >
          Open resource
        </Link>
        <Link
          href="/faculty"
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
        >
          Back to faculty workspace
        </Link>
      </div>
    </PageShell>
  );
}
