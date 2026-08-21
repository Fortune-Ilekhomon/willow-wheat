import { z } from "zod";

export const weekdayValues = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export const dailyAllocationSchema = z.object({
  weekday: z.enum(weekdayValues),
  allocatedUnits: z.coerce.number().int().min(0, "Cannot be negative"),
  isClosed: z.boolean().default(false),
});

// Rules doc §2: daily allocations are a distribution of the weekly total,
// not an independent limit — so this schema validates that relationship
// directly rather than trusting the admin form to get the arithmetic
// right. superRefine (not refine) because the error needs to attach to a
// specific, useful message rather than a generic "invalid" on the whole
// object.
export const capacitySettingsSchema = z
  .object({
    maxWeeklyProductionUnits: z.coerce
      .number()
      .int()
      .min(1, "Weekly capacity must be at least 1"),
    productionBufferUnits: z.coerce.number().int().min(0, "Cannot be negative"),
    minimumNoticeDaysDefault: z.coerce.number().int().min(0, "Cannot be negative"),
    maximumAdvanceBookingDays: z.coerce
      .number()
      .int()
      .min(1, "Must allow booking at least 1 day ahead"),
    dailyAllocations: z.array(dailyAllocationSchema).length(
      7,
      "All seven days must have an allocation, even if closed"
    ),
  })
  .superRefine((data, ctx) => {
    const allocatedTotal = data.dailyAllocations
      .filter((day) => !day.isClosed)
      .reduce((sum, day) => sum + day.allocatedUnits, 0);

    if (allocatedTotal > data.maxWeeklyProductionUnits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dailyAllocations"],
        message: `Daily allocations total ${allocatedTotal} units, which exceeds the weekly capacity of ${data.maxWeeklyProductionUnits}. Reduce a day's allocation or raise the weekly capacity.`,
      });
    }

    if (data.productionBufferUnits >= data.maxWeeklyProductionUnits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productionBufferUnits"],
        message: "Buffer cannot be greater than or equal to the total weekly capacity — there would be no bookable capacity left.",
      });
    }
  });

export type CapacitySettingsInput = z.infer<typeof capacitySettingsSchema>;

export const blockedDateSchema = z.object({
  date: z.coerce.date(),
  reason: z.string().max(200).optional(),
});

export type BlockedDateInput = z.infer<typeof blockedDateSchema>;
