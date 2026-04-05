"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearAuthCookies, signOutWeb } from "@/src/lib/auth/web-auth-client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOutWeb();
      } catch {
        clearAuthCookies();
      } finally {
        router.replace("/login");
        router.refresh();
      }
    };

    void performLogout();
  }, [router]);

  return (
    <main className="page-container py-8">
      <section className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5 text-sm text-[var(--muted)]">
        Signing you out...
      </section>
    </main>
  );
}
