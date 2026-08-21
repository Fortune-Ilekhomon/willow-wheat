import { getActiveCapacitySettings, listBlockedDates } from "@/lib/admin/capacity";
import { weekdayValues } from "@/lib/admin/capacitySchemas";
import { CapacityForm } from "./components/CapacityForm";
import { BlockedDatesManager } from "./components/BlockedDatesManager";

export default async function CapacityPage() {
  const [capacitySettings, blockedDates] = await Promise.all([
    getActiveCapacitySettings(),
    listBlockedDates(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-cocoa">
        Capacity
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        How much work the bakery can accept. This is the master constraint
        the automation engine checks before confirming any order.
      </p>

      <div className="mt-8">
        <CapacityForm
          initialValues={
            capacitySettings
              ? {
                  maxWeeklyProductionUnits:
                    capacitySettings.maxWeeklyProductionUnits.toString(),
                  productionBufferUnits:
                    capacitySettings.productionBufferUnits.toString(),
                  minimumNoticeDaysDefault:
                    capacitySettings.minimumNoticeDaysDefault.toString(),
                  maximumAdvanceBookingDays:
                    capacitySettings.maximumAdvanceBookingDays.toString(),
                  dailyAllocations: capacitySettings.dailyAllocations
                    .slice()
                    // localeCompare on the enum string sorts alphabetically
                    // (Friday, Monday, Saturday...), not calendar order —
                    // sort by index in the canonical weekdayValues list
                    // instead, same order the form's defaultDailyAllocations
                    // and the daily-distribution UI both use.
                    .sort(
                      (a, b) =>
                        weekdayValues.indexOf(a.weekday) -
                        weekdayValues.indexOf(b.weekday)
                    )
                    .map((day) => ({
                      weekday: day.weekday,
                      allocatedUnits: day.allocatedUnits.toString(),
                      isClosed: day.isClosed,
                    })),
                }
              : undefined
          }
        />
      </div>

      <div className="mt-8">
        <BlockedDatesManager
          initialDates={blockedDates.map((date) => ({
            id: date.id,
            date: date.date.toISOString(),
            reason: date.reason,
          }))}
        />
      </div>
    </div>
  );
}
