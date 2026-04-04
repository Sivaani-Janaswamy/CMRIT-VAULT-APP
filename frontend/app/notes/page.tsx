import { PageShell } from "@/src/components/layout/page-shell";

export default function NotesPage() {
  return (
    <PageShell title="Notes" subtitle="Notes feed will be connected to published resources in Phase C.">
      <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)]">
        Notes surface scaffold is ready.
      </div>
    </PageShell>
  );
}
