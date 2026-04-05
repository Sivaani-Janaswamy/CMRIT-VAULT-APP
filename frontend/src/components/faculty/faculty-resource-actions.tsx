"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/src/lib/api/http-client";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface FacultyResourceActionsProps {
  resourceId: string;
  status: string;
}

export function FacultyResourceActions({ resourceId, status }: FacultyResourceActionsProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"submit" | "archive" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const perform = async (action: "submit" | "archive") => {
    const accessToken = readAccessTokenCookie();
    if (!accessToken) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setBusyAction(action);
    setMessage(null);

    try {
      if (action === "submit") {
        await apiRequest(`/v1/resources/${resourceId}/submit`, {
          method: "POST",
          accessToken,
        });
      } else {
        await apiRequest(`/v1/resources/${resourceId}`, {
          method: "DELETE",
          accessToken,
        });
      }

      setMessage(action === "submit" ? "Submitted for review." : "Archived successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const canSubmit = status === "draft";
  const canArchive = status !== "archived";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        {canSubmit ? (
          <button
            type="button"
            onClick={() => void perform("submit")}
            disabled={busyAction !== null}
            className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busyAction === "submit" ? "Submitting..." : "Submit"}
          </button>
        ) : null}
        {canArchive ? (
          <button
            type="button"
            onClick={() => void perform("archive")}
            disabled={busyAction !== null}
            className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busyAction === "archive" ? "Archiving..." : "Archive"}
          </button>
        ) : null}
      </div>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
