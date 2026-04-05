"use client";

import { useState } from "react";

import { ApiError } from "@/src/lib/api/http-client";
import { createDownloadUrl } from "@/src/lib/api/resources";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface DownloadButtonProps {
  resourceId: string;
}

export function DownloadButton({ resourceId }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onDownload = async () => {
    const accessToken = readAccessTokenCookie();
    if (!accessToken) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setIsDownloading(true);
    setMessage(null);

    try {
      const result = await createDownloadUrl(resourceId, accessToken);
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      setMessage("Download link opened in a new tab.");
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : "Unable to generate download link right now.";
      setMessage(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloading}
        className="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isDownloading ? "Generating link..." : "Download"}
      </button>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
