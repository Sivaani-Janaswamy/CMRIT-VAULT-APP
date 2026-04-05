"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/src/lib/api/http-client";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface AdminUserActionsProps {
  userId: string;
  role: "student" | "faculty" | "admin";
  isActive: boolean;
}

export function AdminUserActions({ userId, role, isActive }: AdminUserActionsProps) {
  const router = useRouter();
  const [nextRole, setNextRole] = useState(role);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const withToken = async (handler: (token: string) => Promise<void>) => {
    const token = readAccessTokenCookie();
    if (!token) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await handler(token);
      setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value as "student" | "faculty" | "admin")}
          className="h-8 rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-2 text-xs"
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="button"
          onClick={() =>
            void withToken((token) =>
              apiRequest(`/v1/admin/users/${userId}/role`, {
                method: "PATCH",
                accessToken: token,
                body: JSON.stringify({ role: nextRole }),
              }),
            )
          }
          disabled={busy}
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
        >
          Update Role
        </button>

        <button
          type="button"
          onClick={() =>
            void withToken((token) =>
              apiRequest(`/v1/admin/users/${userId}/status`, {
                method: "PATCH",
                accessToken: token,
                body: JSON.stringify({ is_active: !isActive }),
              }),
            )
          }
          disabled={busy}
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
