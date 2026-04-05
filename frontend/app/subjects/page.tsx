import Link from "next/link";

import { PageShell } from "@/src/components/layout/page-shell";
import { ApiError } from "@/src/lib/api/http-client";
import { fetchSubjects } from "@/src/lib/api/subjects";
import { requireSession } from "@/src/lib/auth/session";

interface SubjectsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SubjectsPage({ searchParams }: SubjectsPageProps) {
  const session = await requireSession(["student", "faculty", "admin"]);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const loweredQuery = query.toLowerCase();
  let subjects = [] as Awaited<ReturnType<typeof fetchSubjects>>;
  let errorMessage: string | null = null;

  try {
    subjects = await fetchSubjects(session.accessToken);
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Unable to load subjects right now. Please try again.";
  }

  if (errorMessage) {
    return (
      <PageShell title="Subjects" subtitle="Browse all subjects available in CMRIT Vault.">
        <div className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-4 text-sm text-[#8f2d2d]">
          {errorMessage}
        </div>
      </PageShell>
    );
  }

  const filteredSubjects = loweredQuery
    ? subjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(loweredQuery) ||
          subject.code.toLowerCase().includes(loweredQuery),
      )
    : subjects;

  if (subjects.length === 0) {
    return (
      <PageShell title="Subjects" subtitle="Browse all subjects available in CMRIT Vault.">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
          No subjects are available right now.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Subjects" subtitle="Browse all subjects available in CMRIT Vault.">
      <div className="space-y-4">
        <form action="/subjects" className="space-y-2" aria-label="Search subjects form">
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search subjects by name or code..."
              className="h-12 w-full rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
            />
            <button
              type="submit"
              className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              Search
            </button>
          </div>
        </form>

        {query && filteredSubjects.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
            No subjects found for &quot;{query}&quot;.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--primary)]"
            >
              <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">{subject.code}</p>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold">{subject.name}</h2>
              <p className="mt-4 text-sm font-medium text-[var(--primary-strong)]">View subject</p>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
