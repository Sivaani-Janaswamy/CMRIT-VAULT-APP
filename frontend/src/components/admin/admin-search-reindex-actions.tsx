"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/src/lib/api/http-client";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface AdminSearchReindexActionsProps {
  resourceId?: string;
}

export function AdminSearchReindexActions({ resourceId }: AdminSearchReindexActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    const token = readAccessTokenCookie();
    if (!token) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const path = resourceId
        ? `/v1/admin/search/resources/${resourceId}/reindex`
        : "/v1/admin/search/reindex";

      await apiRequest(path, {
        method: "POST",
        accessToken: token,
      });

      setMessage(resourceId ? "Resource reindex started." : "Bulk reindex started.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reindex failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
      >
        {busy ? "Running..." : resourceId ? "Reindex" : "Reindex All"}
      </button>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
