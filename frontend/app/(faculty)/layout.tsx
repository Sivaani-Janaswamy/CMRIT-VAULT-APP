import type { ReactNode } from "react";

import { requireSession } from "@/src/lib/auth/session";

export default async function FacultyLayout({ children }: { children: ReactNode }) {
  await requireSession(["faculty", "admin"]);
  return <>{children}</>;
}
