import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AppRole = "student" | "faculty" | "admin";

export interface WebSession {
  accessToken: string;
  role: AppRole;
  userId?: string;
}

const ACCESS_TOKEN_COOKIE = "cmrit_access_token";
const ROLE_COOKIE = "cmrit_role";
const USER_ID_COOKIE = "cmrit_user_id";

function parseRole(value?: string): AppRole | undefined {
  if (value === "student" || value === "faculty" || value === "admin") {
    return value;
  }
  return undefined;
}

export async function getWebSession(): Promise<WebSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = parseRole(cookieStore.get(ROLE_COOKIE)?.value);
  const userId = cookieStore.get(USER_ID_COOKIE)?.value;

  if (!accessToken || !role) {
    return null;
  }

  return { accessToken, role, userId };
}

export async function requireSession(allowedRoles: AppRole[]): Promise<WebSession> {
  const session = await getWebSession();

  if (!session) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.role)) {
    redirect("/");
  }

  return session;
}
