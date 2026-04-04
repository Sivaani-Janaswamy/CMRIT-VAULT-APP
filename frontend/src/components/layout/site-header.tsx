import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/subjects", label: "Subjects" },
  { href: "/notes", label: "Notes" },
  { href: "/pyqs", label: "PYQs" },
  { href: "/search", label: "Search" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-white/85 backdrop-blur-md">
      <div className="page-container flex items-center justify-between py-3">
        <Link href="/" className="text-xl font-semibold leading-tight sm:text-2xl">
          CMRIT Vault
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[var(--radius-pill)] px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-2 flex items-center gap-2 border-l border-[var(--border-soft)] pl-3">
            <Link
              href="/login"
              className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-strong)]"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
