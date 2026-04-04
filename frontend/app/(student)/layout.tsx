import type { ReactNode } from "react";

import { requireSession } from "@/src/lib/auth/session";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireSession(["student", "faculty", "admin"]);
  return <>{children}</>;
}
