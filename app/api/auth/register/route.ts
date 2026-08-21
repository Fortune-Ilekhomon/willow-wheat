import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { registerSchema } from "@/lib/auth/schemas";

// This endpoint only ever creates CUSTOMER accounts. Admin accounts are
// deliberately not self-service — there is no public admin signup route.
// The first AdminProfile is seeded directly (see prisma/seed.ts), and any
// additional staff accounts are created by an existing admin from the
// dashboard in a later phase. A public admin registration endpoint would
// be a real security gap for a single-business system like this one.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague message: do not confirm or deny whether an email
    // is registered to avoid leaking account existence to an attacker
    // enumerating addresses.
    return NextResponse.json(
      { error: "Unable to create account with the provided details" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      accountType: "CUSTOMER",
      customerProfile: {
        create: {
          phone: phone ?? null,
        },
      },
    },
    include: { customerProfile: true },
  });

  const token = createSessionToken({
    userId: user.id,
    accountType: user.accountType,
    customerProfileId: user.customerProfile?.id,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });

  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days, matches SESSION_DURATION in session.ts
    path: "/",
  });

  return response;
}
