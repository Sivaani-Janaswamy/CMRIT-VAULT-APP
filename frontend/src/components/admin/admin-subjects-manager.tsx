"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/src/lib/api/http-client";
import type { SubjectListItem } from "@/src/lib/api/subjects";
import { readAccessTokenCookie } from "@/src/lib/auth/browser-cookies";

interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive: boolean;
}

interface SubjectDetailResponse {
  success: boolean;
  message: string;
  data: {
    subject: SubjectDetail;
  };
  error: unknown;
}

interface AdminSubjectsManagerProps {
  subjects: SubjectListItem[];
}

interface SubjectFormState {
  id: string | null;
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive: boolean;
}

function emptyForm(): SubjectFormState {
  return {
    id: null,
    code: "",
    name: "",
    department: "",
    semester: 1,
    isActive: true,
  };
}

export function AdminSubjectsManager({ subjects }: AdminSubjectsManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<SubjectFormState>(emptyForm());
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
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (id: string) => {
    await withToken(async (token) => {
      const response = await apiRequest<SubjectDetailResponse>(`/v1/subjects/${id}`, {
        method: "GET",
        accessToken: token,
      });

      const subject = response.data.subject;
      setForm({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        department: subject.department,
        semester: subject.semester,
        isActive: subject.isActive,
      });
      setMessage("Loaded subject for editing.");
    });
  };

  const onDelete = async (id: string) => {
    await withToken(async (token) => {
      await apiRequest(`/v1/admin/subjects/${id}`, {
        method: "DELETE",
        accessToken: token,
      });
      setMessage("Subject deleted.");
      if (form.id === id) {
        setForm(emptyForm());
      }
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim() || !form.name.trim() || !form.department.trim()) {
      setMessage("Code, name and department are required.");
      return;
    }

    await withToken(async (token) => {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        department: form.department.trim(),
        semester: form.semester,
        isActive: form.isActive,
      };

      if (form.id) {
        await apiRequest(`/v1/admin/subjects/${form.id}`, {
          method: "PATCH",
          accessToken: token,
          body: JSON.stringify(payload),
        });
        setMessage("Subject updated.");
      } else {
        await apiRequest("/v1/admin/subjects", {
          method: "POST",
          accessToken: token,
          body: JSON.stringify(payload),
        });
        setMessage("Subject created.");
      }

      setForm(emptyForm());
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4 md:grid-cols-2">
        <input
          value={form.code}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
          placeholder="Subject code"
          className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
        />
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Subject name"
          className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
        />
        <input
          value={form.department}
          onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
          placeholder="Department"
          className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
        />
        <input
          type="number"
          min={1}
          max={8}
          value={form.semester}
          onChange={(event) => setForm((prev) => ({ ...prev, semester: Number(event.target.value || 1) }))}
          placeholder="Semester"
          className="h-10 rounded-[12px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          Active subject
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="h-10 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 text-sm font-semibold text-white">
            {busy ? "Saving..." : form.id ? "Update Subject" : "Create Subject"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setForm(emptyForm())}
            className="h-10 rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-4 text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}

      <div className="space-y-2">
        {subjects.map((subject) => (
          <article key={subject.id} className="rounded-[var(--radius-card)] border border-[var(--border-soft)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{subject.code} - {subject.name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void onEdit(subject.id)}
                  className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(subject.id)}
                  className="rounded-[var(--radius-pill)] border border-[var(--border-soft)] px-3 py-1 text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
