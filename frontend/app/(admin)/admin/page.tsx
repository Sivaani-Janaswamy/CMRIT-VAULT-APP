import { PageShell } from "@/src/components/layout/page-shell";

export default function AdminHomePage() {
  return (
    <PageShell
      title="Admin Workspace"
      subtitle="Admin dashboards and controls will be implemented in Phase F."
    >
      <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
        <p className="text-sm text-[var(--muted)]">Route guard is active for admin role only.</p>
      </div>
    </PageShell>
  );
}
