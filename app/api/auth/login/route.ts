import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/schemas";

// One login endpoint for both account types rather than two. The
// distinction between a customer and an admin logging in is which
// AccountType comes back on the User row, not a different code path — the
// middleware is what actually enforces which routes each type may reach.
// Splitting this into /api/auth/customer-login and /api/auth/admin-login
// would duplicate the credential-checking logic for no real gain.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { customerProfile: true },
  });

  // Same error message whether the email does not exist or the password is
  // wrong — do not give an attacker a way to enumerate valid emails.
  const invalidCredentialsResponse = NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );

  if (!user) {
    return invalidCredentialsResponse;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return invalidCredentialsResponse;
  }

  const token = createSessionToken({
    userId: user.id,
    accountType: user.accountType,
    customerProfileId: user.customerProfile?.id,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, accountType: user.accountType },
  });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
