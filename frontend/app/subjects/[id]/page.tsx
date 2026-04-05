import Link from "next/link";

import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import { fetchResourcesForSubject } from "@/src/lib/api/resources";
import { fetchSubjectById } from "@/src/lib/api/subjects";
import { requireSession } from "@/src/lib/auth/session";

interface SubjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    q?: string;
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

export default async function SubjectDetailPage({ params, searchParams }: SubjectDetailPageProps) {
  const session = await requireSession(["student", "faculty", "admin"]);
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? "";
  const loweredQuery = query.toLowerCase();
  let subject: Awaited<ReturnType<typeof fetchSubjectById>> | null = null;
  let resources: Awaited<ReturnType<typeof fetchResourcesForSubject>> = [];
  let errorMessage: string | null = null;

  try {
    [subject, resources] = await Promise.all([
      fetchSubjectById(id, session.accessToken),
      fetchResourcesForSubject({ subjectId: id }, session.accessToken),
    ]);
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load this subject right now. Please try again.";
  }

  if (!subject) {
    return (
      <PageShell title="Subject" subtitle="Subject details">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage ?? "Unable to load this subject right now. Please try again."}
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

  const notes = resources.filter((item) => item.resourceType === "note");
  const pyqs = resources.filter((item) => item.resourceType === "question_paper");
  const listItems = [...notes, ...pyqs];
  const filteredListItems = loweredQuery
    ? listItems.filter((item) => {
        const haystack = [item.title, item.description ?? "", item.fileName, item.academicYear].join(" ").toLowerCase();
        return haystack.includes(loweredQuery);
      })
    : listItems;

  return (
    <PageShell title={subject.name} subtitle={`Subject Code: ${subject.code}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Department</p>
          <p className="mt-2 text-lg font-semibold">{subject.department}</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Semester</p>
          <p className="mt-2 text-lg font-semibold">Sem {subject.semester}</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Status</p>
          <p className="mt-2 text-lg font-semibold">{subject.isActive ? "Active" : "Inactive"}</p>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Last Updated</p>
          <p className="mt-2 text-lg font-semibold">{formatDate(subject.updatedAt)}</p>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notes and PYQs</h2>
          <span className="text-sm text-[var(--muted)]">{filteredListItems.length} items</span>
        </div>

        <form action={`/subjects/${subject.id}`} className="mb-4 space-y-2" aria-label="Search subject resources form">
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search notes and PYQs in this subject..."
              className="h-11 w-full rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              Search
            </button>
          </div>
        </form>

        {listItems.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
            No notes or PYQs are available for this subject yet.
          </div>
        ) : filteredListItems.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
            No items found for &quot;{query}&quot; in this subject.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListItems.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[var(--radius-pill)] bg-[var(--highlight-orange)]/35 px-2.5 py-1 text-xs font-semibold">
                    {formatType(item.resourceType)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">Semester {item.semester}</span>
                  <span className="text-xs text-[var(--muted)]">{item.academicYear}</span>
                </div>
                <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{item.description || item.fileName}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Downloads: {item.downloadCount} · Updated {formatDate(item.updatedAt)}
                </p>
                <div className="mt-3">
                  <Link
                    href={`/resources/${item.id}`}
                    className="inline-flex rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)]"
                  >
                    Open resource
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/subjects"
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-soft)]"
        >
          Back to subjects
        </Link>
        <Link
          href={`/notes?subjectId=${subject.id}`}
          className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
        >
          Open notes page
        </Link>
      </div>
    </PageShell>
  );
}
