"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/src/lib/api/http-client";
import { createDownloadUrl } from "@/src/lib/api/resources";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface ResourcePreviewProps {
  resourceId: string;
  mimeType: string;
  fileName: string;
}

function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.includes("pdf") ||
    mimeType.startsWith("image/") ||
    mimeType.startsWith("text/") ||
    mimeType.includes("json")
  );
}

export function ResourcePreview({ resourceId, mimeType, fileName }: ResourcePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const previewSupported = useMemo(() => isPreviewable(mimeType), [mimeType]);

  const loadPreview = useCallback(async () => {
    if (!previewSupported) {
      setMessage("Preview is not available for this file type. Use Download instead.");
      return;
    }

    const accessToken = readAccessTokenCookie();
    if (!accessToken) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await createDownloadUrl(resourceId, accessToken);
      setPreviewUrl(result.downloadUrl);
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : "Unable to load preview right now.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [previewSupported, resourceId]);

  useEffect(() => {
    if (!previewSupported) {
      setMessage("Preview is not available for this file type. Use Download instead.");
      return;
    }

    void loadPreview();
  }, [previewSupported, loadPreview]);

  return (
    <section className="mt-4 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">Preview</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{fileName}</p>
        </div>
        {isLoading ? <span className="text-xs text-[var(--muted)]">Loading preview...</span> : null}
      </div>

      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}

      {previewUrl ? (
        <div className="overflow-hidden rounded-[12px] border border-[var(--border-soft)]">
          <iframe
            src={previewUrl}
            title="Resource preview"
            className="h-[520px] w-full bg-[#f8faf7]"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">
            {previewSupported
              ? "Preview is not available right now. You can retry or use Download."
              : "This file type usually does not support inline preview."}
          </p>
          {previewSupported ? (
            <button
              type="button"
              onClick={loadPreview}
              disabled={isLoading}
              className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Retrying..." : "Retry preview"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
