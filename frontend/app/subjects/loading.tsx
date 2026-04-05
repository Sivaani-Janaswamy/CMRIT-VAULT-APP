import { PageShell } from "@/src/components/layout/page-shell";

export default function SubjectsLoading() {
  return (
    <PageShell title="Subjects" subtitle="Loading subjects...">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
      </div>
    </PageShell>
  );
}
