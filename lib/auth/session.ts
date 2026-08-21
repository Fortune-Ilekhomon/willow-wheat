import jwt from "jsonwebtoken";
import type { AccountType } from "@prisma/client";

// SESSION_SECRET must be set in the environment. Failing loudly here rather
// than falling back to a default string is intentional: a silent fallback
// secret is exactly the kind of thing that quietly ships to production and
// becomes a real vulnerability. Better to crash on boot than leak that way.
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is not set. Refusing to start without it."
  );
}

const SESSION_DURATION = "7d";

export interface SessionPayload {
  userId: string;
  accountType: AccountType;
  // Distinguishes the customer's linked CustomerProfile id from the raw
  // User id, since order lookups and most customer-facing queries key off
  // CustomerProfile, not User directly. Optional because AdminProfile-typed
  // sessions do not need it, and a customer session created before the
  // profile row exists (mid-registration) should not be blocked on it.
  customerProfileId?: string;
}

export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, SESSION_SECRET as string, {
    expiresIn: SESSION_DURATION,
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SESSION_SECRET as string) as SessionPayload;
  } catch {
    // Expired or tampered token — treat identically to "no session" rather
    // than surfacing the specific jwt error to the caller. The caller only
    // ever needs to know "authenticated" or "not authenticated."
    return null;
  }
}
