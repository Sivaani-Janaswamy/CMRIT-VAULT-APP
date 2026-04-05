"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { signUpWithPassword } from "@/src/lib/auth/web-auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await signUpWithPassword(fullName.trim(), email.trim(), password);

      if (result.message) {
        setInfoMessage(result.message);
        return;
      }

      const rolePath = result.role === "admin" ? "/admin" : result.role === "faculty" ? "/faculty" : "/student";
      router.push(rolePath);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container py-6 sm:py-10">
      <section className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-white p-4 shadow-[var(--shadow-soft)] sm:gap-7 sm:p-6 lg:grid-cols-[1.1fr_1fr] lg:p-8">
        <div className="space-y-5 rounded-[var(--radius-panel)] bg-[var(--surface-soft)] p-5 sm:p-6">
          <p className="inline-flex rounded-[var(--radius-pill)] bg-[var(--highlight-orange)]/35 px-3 py-1 text-xs font-semibold text-[#8d4515]">
            Account Registration
          </p>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">Create your CMRIT Vault account</h1>
            <p className="max-w-md text-sm text-[var(--muted)] sm:text-base">
              Register once to access notes, PYQs, downloads, and your personalized study space.
            </p>
          </div>
          <div className="relative h-44 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white sm:h-56">
            <Image
              src="/banner-3.png"
              alt="CMRIT exam reminder"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[var(--border-soft)] bg-white p-5 sm:p-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Sign Up</h2>
            <p className="text-sm text-[var(--muted)]">Sign-up connection and profile sync will be wired in the next phase.</p>
          </div>

          <form className="mt-6 space-y-4" aria-label="Sign up form" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Full Name</span>
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                placeholder="you@cmrit.ac.in"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface)] px-3.5 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-[12px] border border-[#f3c2c2] bg-[#fff1f1] px-3 py-2 text-sm text-[#8f2d2d]">{errorMessage}</p>
            ) : null}
            {infoMessage ? (
              <p className="rounded-[12px] border border-[#cfe9bd] bg-[#f4ffe8] px-3 py-2 text-sm text-[#3e5f22]">{infoMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-5 border-t border-[var(--border-soft)] pt-4 text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--primary-strong)]">
              Sign in
            </Link>
          </div>
        </div>
      </section>
      <section className="mt-5 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 text-sm text-[var(--muted)] sm:mt-6">
        You can browse public sections after sign-in: {" "}
        <Link href="/notes" className="font-semibold text-[var(--primary-strong)]">
          Notes
        </Link>
        {" · "}
        <Link href="/pyqs" className="font-semibold text-[var(--primary-strong)]">
          PYQs
        </Link>
        {" · "}
        <Link href="/search" className="font-semibold text-[var(--primary-strong)]">
          Search
        </Link>
      </section>
    </main>
  );
}
