"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminSession } from "@/lib/admin/requireAdmin";
import {
  capacitySettingsSchema,
  blockedDateSchema,
  type CapacitySettingsInput,
  type BlockedDateInput,
} from "@/lib/admin/capacitySchemas";

// Returns the single currently-active CapacitySettings row — the one with
// effectiveTo still null, per the schema comment's stated invariant. If
// this ever returns more than one row, that is a bug in updateCapacitySettings
// below, not a valid business state; findFirst rather than findUniqueOrThrow
// so a fresh, never-configured database returns null instead of throwing.
export async function getActiveCapacitySettings() {
  await requireAdminSession();

  return prisma.capacitySettings.findFirst({
    where: { effectiveTo: null },
    include: { dailyAllocations: true },
    orderBy: { effectiveFrom: "desc" },
  });
}

// This is the enforcement the schema comment on CapacitySettings promises
// but does not itself implement: updating capacity does not mutate the
// existing row in place. It closes out the current row (effectiveTo = now)
// and inserts a new one. This preserves a real history of what the
// bakery's capacity rules were at any past point in time — useful later
// for understanding why a given week's schedule looked the way it did,
// and required if this system is ever audited against a specific week's
// actual booking behavior.
//
// Wrapped in a transaction because leaving two rows simultaneously active
// (if the close-out succeeded but the insert failed) would break the "one
// active row" invariant every other query in this file depends on.
export async function updateCapacitySettings(input: CapacitySettingsInput) {
  await requireAdminSession();

  const parsed = capacitySettingsSchema.parse(input);

  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.capacitySettings.findFirst({
      where: { effectiveTo: null },
    });

    const now = new Date();

    if (current) {
      await tx.capacitySettings.update({
        where: { id: current.id },
        data: { effectiveTo: now },
      });
    }

    return tx.capacitySettings.create({
      data: {
        maxWeeklyProductionUnits: parsed.maxWeeklyProductionUnits,
        productionBufferUnits: parsed.productionBufferUnits,
        minimumNoticeDaysDefault: parsed.minimumNoticeDaysDefault,
        maximumAdvanceBookingDays: parsed.maximumAdvanceBookingDays,
        effectiveFrom: now,
        dailyAllocations: {
          create: parsed.dailyAllocations.map((day) => ({
            weekday: day.weekday,
            allocatedUnits: day.allocatedUnits,
            isClosed: day.isClosed,
          })),
        },
      },
      include: { dailyAllocations: true },
    });
  });

  revalidatePath("/admin/capacity");
  revalidatePath("/admin"); // Production Overview reads current capacity too
  return updated;
}

export async function listBlockedDates() {
  await requireAdminSession();

  return prisma.blockedDate.findMany({
    where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    orderBy: { date: "asc" },
  });
}

export async function addBlockedDate(input: BlockedDateInput) {
  await requireAdminSession();

  const parsed = blockedDateSchema.parse(input);

  const blocked = await prisma.blockedDate.create({
    data: { date: parsed.date, reason: parsed.reason },
  });

  revalidatePath("/admin/capacity");
  return blocked;
}

export async function removeBlockedDate(id: string) {
  await requireAdminSession();

  await prisma.blockedDate.delete({ where: { id } });

  revalidatePath("/admin/capacity");
}
