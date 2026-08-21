import { PrismaClient } from "@prisma/client";

// Standard Next.js pattern: in dev, hot-reload re-executes this module on
// every save, which would otherwise open a new PrismaClient (and a new DB
// connection pool) every time. Stashing the instance on the global object
// survives the reload. In production this branch never matters since the
// process does not hot-reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
