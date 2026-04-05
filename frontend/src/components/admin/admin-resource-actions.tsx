"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/src/lib/api/http-client";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface AdminResourceActionsProps {
  resourceId: string;
}

export function AdminResourceActions({ resourceId }: AdminResourceActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"published" | "rejected" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const updateStatus = async (status: "published" | "rejected") => {
    const token = readAccessTokenCookie();
    if (!token) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setBusy(status);
    setMessage(null);

    try {
      await apiRequest(`/v1/admin/resources/${resourceId}/status`, {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ status }),
      });
      setMessage("Status updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status update failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void updateStatus("published")}
          disabled={busy !== null}
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
        >
          {busy === "published" ? "Publishing..." : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => void updateStatus("rejected")}
          disabled={busy !== null}
          className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
        >
          {busy === "rejected" ? "Rejecting..." : "Reject"}
        </button>
      </div>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
