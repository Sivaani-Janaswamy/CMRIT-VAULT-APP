import { PageShell } from "@/src/components/layout/page-shell";

export default function FacultyLoading() {
  return (
    <PageShell title="Faculty Workspace" subtitle="Loading faculty dashboard...">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
      </div>
    </PageShell>
  );
}
