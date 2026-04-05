import { PageShell } from "@/src/components/layout/page-shell";

export default function SearchLoading() {
  return (
    <PageShell title="Search" subtitle="Loading search workspace...">
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-[var(--radius-pill)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
      </div>
    </PageShell>
  );
}
