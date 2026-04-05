import { PageShell } from "@/src/components/layout/page-shell";
import { SearchClient } from "@/src/components/search/search-client";
import { fetchSubjects } from "@/src/lib/api/subjects";
import { requireSession } from "@/src/lib/auth/session";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    resourceType?: "note" | "question_paper" | "faculty_upload";
    subjectId?: string;
    semester?: string;
    department?: string;
    academicYear?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await requireSession(["student", "faculty", "admin"]);
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const initialPage = Number.parseInt(params.page ?? "1", 10);
  const subjectOptions = await fetchSubjects(session.accessToken);

  return (
    <PageShell title="Search" subtitle="Search notes, PYQs, and subject resources.">
      <SearchClient
        initialQuery={initialQuery}
        initialPage={Number.isNaN(initialPage) || initialPage < 1 ? 1 : initialPage}
        initialFilters={{
          resourceType: params.resourceType ?? "",
          subjectId: params.subjectId ?? "",
          semester: params.semester ?? "",
          department: params.department ?? "",
          academicYear: params.academicYear ?? "",
        }}
        subjectOptions={subjectOptions}
      />
    </PageShell>
  );
}
