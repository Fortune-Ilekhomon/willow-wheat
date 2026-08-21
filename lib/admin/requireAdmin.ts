import { getSession } from "@/lib/auth/getSession";

// Every admin server action needs this exact check before touching the
// database. Centralizing it here means a future change to what "being an
// admin" requires (e.g. a specific permission flag, not just accountType)
// only has to change in one place, rather than being re-implemented
// slightly differently across products.ts, capacity.ts, productionRules.ts,
// and every module that follows in later phases.
//
// This throws rather than returning null/false deliberately: a server
// action reaching this point already passed through middleware, which
// means a missing or invalid session here is not an expected "user isn't
// logged in yet" case to handle gracefully — it is either a forged
// request or an expired session mid-action. Both should fail loudly.
export async function requireAdminSession() {
  const session = await getSession();

  if (!session || session.accountType !== "ADMIN") {
    throw new Error("Not authorized. Admin session required.");
  }

  return session;
}
