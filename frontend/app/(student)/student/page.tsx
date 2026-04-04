import { PageShell } from "@/src/components/layout/page-shell";

export default function StudentHomePage() {
  return (
    <PageShell
      title="Student Workspace"
      subtitle="Student feature implementation starts in Phase C with subjects, resources, and downloads."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-sm font-medium">Subjects</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Browse all available subjects.</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-sm font-medium">Resources</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Open published notes and files.</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
          <p className="text-sm font-medium">Downloads</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Track what you accessed recently.</p>
        </div>
      </div>
    </PageShell>
  );
}
