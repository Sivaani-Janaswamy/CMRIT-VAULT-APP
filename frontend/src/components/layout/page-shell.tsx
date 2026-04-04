import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="page-container py-10">
      <section className="glass-panel p-6 sm:p-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {subtitle ? <p className="max-w-2xl text-sm text-[var(--muted)] sm:text-base">{subtitle}</p> : null}
        </header>
        {children}
      </section>
    </main>
  );
}
