import { PageShell } from "@/src/components/layout/page-shell";

export default function FacultyHomePage() {
  return (
    <PageShell
      title="Faculty Workspace"
      subtitle="Faculty dashboard, resource lifecycle, and stats will be added in Phase E."
    >
      <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
        <p className="text-sm text-[var(--muted)]">Route guard is active for faculty/admin roles.</p>
      </div>
    </PageShell>
  );
}
