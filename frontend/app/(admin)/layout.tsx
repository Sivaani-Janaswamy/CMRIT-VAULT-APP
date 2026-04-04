import type { ReactNode } from "react";

import { requireSession } from "@/src/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSession(["admin"]);
  return <>{children}</>;
}
