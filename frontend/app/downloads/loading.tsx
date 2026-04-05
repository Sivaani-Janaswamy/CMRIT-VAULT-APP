import { PageShell } from "@/src/components/layout/page-shell";

export default function DownloadsLoading() {
  return (
    <PageShell title="Downloads" subtitle="Loading downloads history...">
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-soft)]" />
      </div>
    </PageShell>
  );
}
