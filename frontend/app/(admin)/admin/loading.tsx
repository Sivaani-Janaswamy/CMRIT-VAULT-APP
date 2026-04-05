import { PageShell } from "@/src/components/layout/page-shell";

export default function AdminLoading() {
  return (
    <PageShell title="Admin Workspace" subtitle="Loading admin controls...">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
      </div>
    </PageShell>
  );
}
