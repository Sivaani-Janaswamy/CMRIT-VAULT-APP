"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/src/lib/api/http-client";
import {
  searchResources,
  suggestResources,
  type SearchFiltersInput,
  type SearchResultItem,
  type SearchSuggestionItem,
} from "@/src/lib/api/search";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface SearchClientProps {
  initialQuery: string;
  initialPage: number;
  initialFilters: {
    resourceType: "" | "note" | "question_paper" | "faculty_upload";
    subjectId: string;
    semester: string;
    department: string;
    academicYear: string;
  };
  subjectOptions: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

function resourceTypeLabel(type: SearchResultItem["resourceType"]): string {
  if (type === "question_paper") {
    return "PYQ";
  }
  if (type === "faculty_upload") {
    return "Faculty Upload";
  }
  return "Note";
}

export function SearchClient({ initialQuery, initialPage, initialFilters, subjectOptions }: SearchClientProps) {
  const router = useRouter();
  const accessToken = useMemo(() => readAccessTokenCookie(), []);

  const [query, setQuery] = useState(initialQuery);
  const [resourceType, setResourceType] = useState(initialFilters.resourceType);
  const [subjectId, setSubjectId] = useState(initialFilters.subjectId);
  const [semester, setSemester] = useState(initialFilters.semester);
  const [department, setDepartment] = useState(initialFilters.department);
  const [academicYear, setAcademicYear] = useState(initialFilters.academicYear);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const pageSize = 20;
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || !accessToken) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const items = await suggestResources(query.trim(), accessToken);
        setSuggestions(items);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, accessToken]);

  const runSearch = useCallback(async (term: string, filters: SearchFiltersInput, targetPage: number) => {
    if (!accessToken) {
      setSearchError("Session not found. Please sign in again.");
      return;
    }

    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchResources(trimmed, accessToken, filters, targetPage, pageSize);
      setResults(response.items);
      setTotal(response.total);
      setPage(response.page);
      setSuggestions([]);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to search right now. Please try again.";
      setSearchError(message);
      setResults([]);
      setTotal(0);
    } finally {
      setIsSearching(false);
    }
  }, [accessToken]);

  const currentFilters = useMemo<SearchFiltersInput>(() => {
    const parsedSemester = Number.parseInt(semester, 10);

    return {
      resourceType: resourceType || undefined,
      subjectId: subjectId || undefined,
      semester: Number.isNaN(parsedSemester) ? undefined : parsedSemester,
      department: department.trim() || undefined,
      academicYear: academicYear.trim() || undefined,
    };
  }, [resourceType, subjectId, semester, department, academicYear]);

  useEffect(() => {
    if (!initialQuery.trim()) {
      return;
    }

    void runSearch(initialQuery, {
      resourceType: initialFilters.resourceType || undefined,
      subjectId: initialFilters.subjectId || undefined,
      semester: initialFilters.semester ? Number.parseInt(initialFilters.semester, 10) : undefined,
      department: initialFilters.department || undefined,
      academicYear: initialFilters.academicYear || undefined,
    }, initialPage);
  }, [initialQuery, initialFilters, initialPage, runSearch]);

  const buildSearchParams = useCallback((nextQuery: string, nextPage: number) => {
    const params = new URLSearchParams();
    if (nextQuery) {
      params.set("q", nextQuery);
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    if (resourceType) {
      params.set("resourceType", resourceType);
    }
    if (subjectId) {
      params.set("subjectId", subjectId);
    }
    if (semester) {
      params.set("semester", semester);
    }
    if (department.trim()) {
      params.set("department", department.trim());
    }
    if (academicYear.trim()) {
      params.set("academicYear", academicYear.trim());
    }

    return params;
  }, [resourceType, subjectId, semester, department, academicYear]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();

    const params = buildSearchParams(nextQuery, 1);

    router.replace(params.toString() ? `/search?${params.toString()}` : "/search");
    await runSearch(nextQuery, currentFilters, 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onChangePage = async (nextPage: number) => {
    const normalized = Math.min(Math.max(nextPage, 1), totalPages);
    const nextQuery = query.trim();
    const params = buildSearchParams(nextQuery, normalized);

    router.replace(params.toString() ? `/search?${params.toString()}` : "/search");
    await runSearch(nextQuery, currentFilters, normalized);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3" aria-label="Search resources form">
        <div className="flex gap-2">
          <label htmlFor="global-search" className="sr-only">Search query</label>
          <input
            id="global-search"
            type="search"
            placeholder="Search notes, PYQs, subjects..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
          />
          <button
            type="submit"
            aria-label="Run search"
            className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
          >
            Search
          </button>
        </div>

        <div className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-3 md:grid-cols-5">
          <select
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value as "" | "note" | "question_paper" | "faculty_upload")}
            aria-label="Filter by resource type"
            className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">All Types</option>
            <option value="note">Notes</option>
            <option value="question_paper">PYQs</option>
            <option value="faculty_upload">Faculty Uploads</option>
          </select>

          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            aria-label="Filter by subject"
            className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">All Subjects</option>
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>

          <select
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            aria-label="Filter by semester"
            className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">All Semesters</option>
            {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={String(value)}>
                Sem {value}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Department"
            aria-label="Filter by department"
            className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />

          <input
            type="text"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
            placeholder="Academic Year"
            aria-label="Filter by academic year"
            className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
        </div>

        {suggestions.length > 0 ? (
          <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-2">
            {suggestions.map((item) => (
              <button
                key={item.resourceId}
                type="button"
                onClick={async () => {
                  setQuery(item.title);

                  const params = buildSearchParams(item.title, 1);

                  router.replace(`/search?${params.toString()}`);
                  await runSearch(item.title, currentFilters, 1);
                }}
                className="block w-full rounded-[10px] px-3 py-2 text-left text-sm transition hover:bg-[var(--surface-soft)]"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-[var(--muted)]">{item.subjectName} · {resourceTypeLabel(item.resourceType)}</p>
              </button>
            ))}
          </div>
        ) : null}
      </form>

      {isSearching ? <p className="text-sm text-[var(--muted)]">Searching...</p> : null}
      {searchError ? (
        <p className="rounded-[var(--radius-card)] border border-[#f3c2c2] bg-[#fff1f1] p-3 text-sm text-[#8f2d2d]">{searchError}</p>
      ) : null}

      {!isSearching && !searchError && results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">{total} results found</p>
          {results.map((item) => (
            <article key={item.resourceId} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-[var(--radius-pill)] bg-[var(--highlight-orange)]/35 px-2.5 py-1 text-xs font-semibold">
                  {resourceTypeLabel(item.resourceType)}
                </span>
                <span className="text-xs text-[var(--muted)]">{item.subjectCode}</span>
                <span className="text-xs text-[var(--muted)]">Sem {item.semester}</span>
              </div>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.description || item.fileName}</p>
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
              <button
                type="button"
                onClick={() => void onChangePage(page - 1)}
                disabled={page <= 1}
                className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <p className="text-xs text-[var(--muted)]">Page {page} of {totalPages}</p>
              <button
                type="button"
                onClick={() => void onChangePage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isSearching && !searchError && query.trim() && results.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-3 text-sm text-[var(--muted)]">
          No results found for &quot;{query.trim()}&quot;.
        </p>
      ) : null}
    </div>
  );
}
