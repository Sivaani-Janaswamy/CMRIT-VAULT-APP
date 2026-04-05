import Link from "next/link";

import { DownloadButton } from "@/src/components/resources/download-button";
import { ResourcePreview } from "@/src/components/resources/resource-preview";
import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import { fetchResourceById } from "@/src/lib/api/resources";
import { requireSession } from "@/src/lib/auth/session";

interface ResourceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(input: string): string {
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

function formatType(type: "note" | "question_paper" | "faculty_upload"): string {
  if (type === "question_paper") {
    return "PYQ";
  }
  if (type === "faculty_upload") {
    return "Faculty Upload";
  }
  return "Note";
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const session = await requireSession(["student", "faculty", "admin"]);
  const { id } = await params;
  let resource: Awaited<ReturnType<typeof fetchResourceById>> | null = null;
  let errorMessage: string | null = null;

  try {
    resource = await fetchResourceById(id, session.accessToken);
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load this resource right now.";
  }

  if (!resource) {
    return (
      <PageShell title="Resource" subtitle="Resource details">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage ?? "Unable to load this resource right now."}
        </div>
        <div className="mt-4">
          <Link
            href="/subjects"
            className="inline-flex rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
          >
            Back to subjects
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={resource.title} subtitle={`${formatType(resource.resourceType)} · ${resource.academicYear}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Type</p>
          <p className="mt-2 text-lg font-semibold">{formatType(resource.resourceType)}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Semester</p>
          <p className="mt-2 text-lg font-semibold">Sem {resource.semester}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Downloads</p>
          <p className="mt-2 text-lg font-semibold">{resource.downloadCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Last Updated</p>
          <p className="mt-2 text-lg font-semibold">{formatDate(resource.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
        <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Description</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{resource.description || resource.fileName}</p>
      </div>

      <ResourcePreview
        resourceId={resource.id}
        mimeType={resource.mimeType}
        fileName={resource.fileName}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DownloadButton resourceId={resource.id} />
        <Link
          href={`/subjects/${resource.subjectId}`}
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
        >
          Back to subject
        </Link>
      </div>
    </PageShell>
  );
}
