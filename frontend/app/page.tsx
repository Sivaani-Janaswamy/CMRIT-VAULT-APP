import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="page-container flex flex-1 flex-col gap-6 py-8 sm:gap-8 sm:py-10">
      <section className="glass-panel grid gap-6 overflow-hidden p-5 sm:p-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <span className="inline-flex rounded-[var(--radius-pill)] bg-[var(--highlight-green)]/25 px-3 py-1 text-xs font-semibold tracking-wider text-[#5f6910]">
            Campus Resource Platform
          </span>
          <div className="space-y-3">
            <h1 className="max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              CMRIT Vault for Students, Faculty, and Admin Teams
            </h1>
            <p className="max-w-xl text-sm text-[var(--muted)] sm:text-base">
              Access curated academic resources, publish materials, and manage moderation workflows in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface-soft)]"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="relative min-h-60 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-white">
          <Image
            src="/banner-1.png"
            alt="CMRIT Vault banner"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Student",
            description: "Browse subjects, find resources, and track download history.",
            href: "/student",
          },
          {
            title: "Faculty",
            description: "Create, submit, and monitor resource performance.",
            href: "/faculty",
          },
          {
            title: "Admin",
            description: "Moderate content, manage users, and monitor usage metrics.",
            href: "/admin",
          },
        ].map((item, index) => (
          <article
            key={item.title}
            className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="mb-3 inline-flex rounded-[var(--radius-pill)] bg-[var(--highlight-orange)]/35 px-2.5 py-1 text-xs font-semibold">
              0{index + 1}
            </div>
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
            <Link href={item.href} className="mt-4 inline-flex text-sm font-semibold text-[var(--primary-strong)]">
              Open workspace
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
