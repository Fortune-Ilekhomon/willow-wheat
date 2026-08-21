import { cookies } from "next/headers";
import { verifySessionToken, type SessionPayload } from "@/lib/auth/session";

// Thin wrapper so server components and route handlers do not each need to
// know the cookie is named "session" or how to call jsonwebtoken directly.
// If the session storage mechanism changes later (e.g. moving to a DB-backed
// session table for revocation support), this is the one place that changes.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
