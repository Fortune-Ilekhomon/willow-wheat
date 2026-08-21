import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// This script exists because there is deliberately no public admin
// registration endpoint (see app/api/auth/register/route.ts comment). The
// owner's very first login has to come from somewhere. Run once against a
// fresh database: `npx tsx prisma/seed.ts`.
//
// ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD must be set in the environment
// rather than hardcoded here, so this file can be safely committed to
// source control without embedding real credentials.
async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? "Bakery Owner";

  if (!email || !password) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in the environment before seeding."
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account for ${email} already exists. Skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      accountType: "ADMIN",
      adminProfile: {
        create: {
          role: "owner",
        },
      },
    },
  });

  console.log(`Admin account created for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
