"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/src/lib/api/http-client";
import type { ResourceItem, ResourceType } from "@/src/lib/api/resources";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";
import { getSupabaseBrowserClient } from "@/src/lib/auth/supabase-browser";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface FacultyResourceFormProps {
  subjects: SubjectOption[];
  initialResource?: ResourceItem | null;
}

interface ResourcePayload {
  subjectId: string;
  resourceType: ResourceType;
  title: string;
  description: string | null;
  academicYear: string;
  semester: number;
}

interface CreateResourceEntry {
  id: string;
  title: string;
  description: string;
  file: File | null;
}

function createEmptyEntry(): CreateResourceEntry {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    title: "",
    description: "",
    file: null,
  };
}

function getDefaultPayload(resource?: ResourceItem | null): ResourcePayload {
  if (!resource) {
    return {
      subjectId: "",
      resourceType: "note",
      title: "",
      description: null,
      academicYear: "2025-26",
      semester: 1,
    };
  }

  return {
    subjectId: resource.subjectId,
    resourceType: resource.resourceType,
    title: resource.title,
    description: resource.description,
    academicYear: resource.academicYear,
    semester: resource.semester,
  };
}

function buildStoragePath(subjectId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  return `resources/${subjectId}/${Date.now()}-${unique}-${safeName}`;
}

async function uploadFileToStorage(filePath: string, file: File): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from("cmrit-vault-files").upload(filePath, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message || "Unable to upload file to storage.");
  }
}

export function FacultyResourceForm({ subjects, initialResource }: FacultyResourceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ResourcePayload>(() => getDefaultPayload(initialResource));
  const [subjectQuery, setSubjectQuery] = useState("");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [createEntries, setCreateEntries] = useState<CreateResourceEntry[]>([createEmptyEntry()]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isEdit = Boolean(initialResource);

  useEffect(() => {
    if (!form.subjectId) {
      setSubjectQuery("");
      return;
    }

    const matched = subjects.find((subject) => subject.id === form.subjectId);
    if (matched) {
      setSubjectQuery(`${matched.code} - ${matched.name}`);
    }
  }, [form.subjectId, subjects]);

  const chosenSubject = subjects.find((subject) => subject.id === form.subjectId) ?? null;

  const filteredSubjects = useMemo(() => {
    const query = subjectQuery.trim().toLowerCase();
    if (!query) {
      if (!chosenSubject) {
        return subjects.slice(0, 8);
      }

      const others = subjects.filter((subject) => subject.id !== chosenSubject.id).slice(0, 7);
      return [chosenSubject, ...others];
    }

    return subjects
      .filter((subject) => `${subject.code} ${subject.name}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [subjectQuery, subjects, chosenSubject]);

  useEffect(() => {
    if (isEdit) {
      return;
    }

    setExpandedEntryIds((prev) => {
      const existing = new Set(prev);
      for (const entry of createEntries) {
        if (!existing.has(entry.id)) {
          existing.add(entry.id);
        }
      }

      return Array.from(existing).filter((id) => createEntries.some((entry) => entry.id === id));
    });
  }, [createEntries, isEdit]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const accessToken = readAccessTokenCookie();
    if (!accessToken) {
      setMessage("Session expired. Please sign in again.");
      return;
    }

    if (!form.subjectId) {
      setMessage("Please choose a subject.");
      return;
    }

    if (!isEdit && createEntries.length === 0) {
      setMessage("Add at least one resource entry.");
      return;
    }

    if (!isEdit) {
      const hasInvalidEntry = createEntries.some((entry) => !entry.title.trim() || !entry.file);
      if (hasInvalidEntry) {
        setMessage("Each added resource needs a title and file.");
        return;
      }
    }

    if (isEdit && !form.title.trim()) {
      setMessage("Title is required while editing a resource.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isEdit && initialResource) {
        const payload: Record<string, unknown> = {
          subjectId: form.subjectId,
          title: form.title.trim(),
          description: form.description?.trim() || null,
          resourceType: form.resourceType,
          academicYear: form.academicYear,
          semester: form.semester,
        };

        if (replacementFile) {
          const filePath = buildStoragePath(form.subjectId, replacementFile.name);
          await uploadFileToStorage(filePath, replacementFile);
          payload.fileName = replacementFile.name;
          payload.filePath = filePath;
          payload.fileSizeBytes = replacementFile.size;
          payload.mimeType = replacementFile.type || "application/octet-stream";
        }

        await apiRequest(`/v1/resources/${initialResource.id}`, {
          method: "PATCH",
          accessToken,
          body: JSON.stringify(payload),
        });
        setMessage("Resource updated successfully.");
      } else {
        let successCount = 0;

        for (const entry of createEntries) {
          if (!entry.file) {
            continue;
          }

          const filePath = buildStoragePath(form.subjectId, entry.file.name);
          await uploadFileToStorage(filePath, entry.file);

          await apiRequest("/v1/resources", {
            method: "POST",
            accessToken,
            body: JSON.stringify({
              subjectId: form.subjectId,
              title: entry.title.trim(),
              description: entry.description.trim() || null,
              resourceType: form.resourceType,
              academicYear: form.academicYear,
              semester: form.semester,
              fileName: entry.file.name,
              filePath,
              fileSizeBytes: entry.file.size,
              mimeType: entry.file.type || "application/octet-stream",
            }),
          });

          successCount += 1;
        }

        setMessage(`Created ${successCount} resource${successCount > 1 ? "s" : ""} successfully.`);
        setForm(getDefaultPayload(null));
        const freshEntry = createEmptyEntry();
        setCreateEntries([freshEntry]);
        setExpandedEntryIds([freshEntry.id]);
        setSubjectQuery("");
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save resource right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
      <h2 className="text-base font-semibold">{isEdit ? "Edit Resource" : "Create Resource"}</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="subject-search" className="text-sm font-medium">Select Subject</label>
          <input
            id="subject-search"
            type="text"
            value={subjectQuery}
            onChange={(event) => setSubjectQuery(event.target.value)}
            placeholder="Type subject code or name..."
            className="h-10 w-full rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
          <div className="max-h-36 overflow-y-auto rounded-[12px] border border-[var(--border-soft)] bg-white p-1">
            {filteredSubjects.length === 0 ? (
              <p className="px-2 py-1 text-xs text-[var(--muted)]">
                {chosenSubject ? "Keep current selection or type another subject." : "No subjects match this query."}
              </p>
            ) : (
              filteredSubjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, subjectId: subject.id }));
                    setSubjectQuery(`${subject.code} - ${subject.name}`);
                  }}
                  className="block w-full rounded-[8px] px-2 py-1 text-left text-sm transition hover:bg-[var(--surface-soft)]"
                >
                  {subject.code} - {subject.name}
                </button>
              ))
            )}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Selected: {chosenSubject ? `${chosenSubject.code} - ${chosenSubject.name}` : "None"}
          </p>
        </div>

        {isEdit ? (
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Resource title"
            className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
        ) : (
          <div className="h-10 rounded-[12px] border border-transparent" aria-hidden="true" />
        )}

        <div className="rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-2">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--muted)]">Resource Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, resourceType: "note" }))}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition ${
                form.resourceType === "note"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border-soft)] bg-white text-[var(--text-strong)]"
              }`}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, resourceType: "question_paper" }))}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition ${
                form.resourceType === "question_paper"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border-soft)] bg-white text-[var(--text-strong)]"
              }`}
            >
              PYQs
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, resourceType: "faculty_upload" }))}
              className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold transition ${
                form.resourceType === "faculty_upload"
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border-soft)] bg-white text-[var(--text-strong)]"
              }`}
            >
              Other
            </button>
          </div>
        </div>

        <input
          type="text"
          value={form.academicYear}
          onChange={(event) => setForm((prev) => ({ ...prev, academicYear: event.target.value }))}
          placeholder="Academic year (e.g. 2025-26)"
          className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
        />

        <input
          type="number"
          min={1}
          max={8}
          value={form.semester}
          onChange={(event) => setForm((prev) => ({ ...prev, semester: Number(event.target.value || 1) }))}
          placeholder="Semester"
          className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm outline-none transition focus:border-[var(--primary)]"
        />
      </div>

      <div className="space-y-2">
        {isEdit ? (
          <>
            <label htmlFor="resource-file" className="text-sm font-medium">Replace File (optional)</label>
            <input
              id="resource-file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
              onChange={(event) => setReplacementFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
            />
            <p className="text-xs text-[var(--muted)]">
              {replacementFile ? replacementFile.name : "No replacement file selected. Existing file will be retained."}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Resource Entries</p>
              <button
                type="button"
                onClick={() => {
                  const nextEntry = createEmptyEntry();
                  setCreateEntries((prev) => [...prev, nextEntry]);
                  setExpandedEntryIds((prev) => [...prev, nextEntry.id]);
                }}
                className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
              >
                + Add Resource
              </button>
            </div>

            {createEntries.map((entry, index) => (
              <div key={entry.id} className="space-y-2 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEntryIds((prev) =>
                        prev.includes(entry.id) ? prev.filter((id) => id !== entry.id) : [...prev, entry.id],
                      )
                    }
                    className="text-xs font-semibold text-[var(--muted)]"
                  >
                    Entry {index + 1} {expandedEntryIds.includes(entry.id) ? "-" : "+"}
                  </button>
                  <div className="flex items-center gap-2">
                    {entry.file ? <span className="text-[11px] text-[var(--muted)]">{entry.file.name}</span> : null}
                    {createEntries.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCreateEntries((prev) => prev.filter((item) => item.id !== entry.id));
                          setExpandedEntryIds((prev) => prev.filter((id) => id !== entry.id));
                        }}
                        className="text-xs font-semibold text-[var(--muted)]"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>

                {expandedEntryIds.includes(entry.id) ? (
                  <>
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(event) =>
                        setCreateEntries((prev) =>
                          prev.map((item) => (item.id === entry.id ? { ...item, title: event.target.value } : item)),
                        )
                      }
                      placeholder="Title"
                      className="h-10 w-full rounded-[12px] border border-[var(--border-soft)] bg-white px-3 text-sm"
                    />

                    <textarea
                      value={entry.description}
                      onChange={(event) =>
                        setCreateEntries((prev) =>
                          prev.map((item) => (item.id === entry.id ? { ...item, description: event.target.value } : item)),
                        )
                      }
                      placeholder="Description"
                      rows={2}
                      className="w-full rounded-[12px] border border-[var(--border-soft)] bg-white px-3 py-2 text-sm"
                    />

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.zip"
                      onChange={(event) =>
                        setCreateEntries((prev) =>
                          prev.map((item) => (item.id === entry.id ? { ...item, file: event.target.files?.[0] ?? null } : item)),
                        )
                      }
                      className="block w-full rounded-[12px] border border-[var(--border-soft)] bg-white px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-[var(--muted)]">{entry.file ? entry.file.name : "No file selected"}</p>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {isEdit ? (
        <textarea
          value={form.description ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value || null }))}
          placeholder="Description"
          rows={3}
          className="w-full rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
        />
      ) : null}

      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-10 rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : isEdit ? "Update Resource" : "Create Resource"}
      </button>
    </form>
  );
}
