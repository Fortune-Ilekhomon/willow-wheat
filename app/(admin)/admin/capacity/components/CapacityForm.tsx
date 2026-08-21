"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCapacitySettings } from "@/lib/admin/capacity";
import { weekdayValues } from "@/lib/admin/capacitySchemas";

const WEEKDAY_LABELS: Record<string, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

interface DailyRow {
  weekday: (typeof weekdayValues)[number];
  allocatedUnits: string;
  isClosed: boolean;
}

interface CapacityFormProps {
  initialValues?: {
    maxWeeklyProductionUnits: string;
    productionBufferUnits: string;
    minimumNoticeDaysDefault: string;
    maximumAdvanceBookingDays: string;
    dailyAllocations: DailyRow[];
  };
}

function defaultDailyAllocations(): DailyRow[] {
  return weekdayValues.map((weekday) => ({
    weekday,
    allocatedUnits: "0",
    isClosed: false,
  }));
}

// Every save creates a new effective-dated CapacitySettings row rather
// than editing in place — see the comment on updateCapacitySettings in
// lib/admin/capacity.ts. From the admin's point of view this is invisible;
// the form just always shows "current settings" and saving always means
// "these are the new current settings, starting now."
export function CapacityForm({ initialValues }: CapacityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [maxWeekly, setMaxWeekly] = useState(
    initialValues?.maxWeeklyProductionUnits ?? ""
  );
  const [buffer, setBuffer] = useState(
    initialValues?.productionBufferUnits ?? ""
  );
  const [minNotice, setMinNotice] = useState(
    initialValues?.minimumNoticeDaysDefault ?? ""
  );
  const [maxAdvance, setMaxAdvance] = useState(
    initialValues?.maximumAdvanceBookingDays ?? ""
  );
  const [dailyAllocations, setDailyAllocations] = useState<DailyRow[]>(
    initialValues?.dailyAllocations ?? defaultDailyAllocations()
  );

  const allocatedTotal = dailyAllocations
    .filter((day) => !day.isClosed)
    .reduce((sum, day) => sum + (Number(day.allocatedUnits) || 0), 0);
  const weeklyMaxNumber = Number(maxWeekly) || 0;
  const bufferNumber = Number(buffer) || 0;
  const bookableCapacity = weeklyMaxNumber - bufferNumber;
  const totalExceedsWeekly = allocatedTotal > weeklyMaxNumber;

  function updateDay(index: number, patch: Partial<DailyRow>) {
    setDailyAllocations((current) =>
      current.map((day, i) => (i === index ? { ...day, ...patch } : day))
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateCapacitySettings({
        maxWeeklyProductionUnits: Number(maxWeekly),
        productionBufferUnits: Number(buffer),
        minimumNoticeDaysDefault: Number(minNotice),
        maximumAdvanceBookingDays: Number(maxAdvance),
        dailyAllocations: dailyAllocations.map((day) => ({
          weekday: day.weekday,
          allocatedUnits: Number(day.allocatedUnits) || 0,
          isClosed: day.isClosed,
        })),
      });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving capacity settings. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-cocoa">
          Weekly limits
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          The weekly total is the master constraint. Daily allocation below
          only distributes it across the week — it cannot add capacity on
          top of it.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <NumberField
            label="Maximum weekly production units"
            value={maxWeekly}
            onChange={setMaxWeekly}
            required
            min="1"
          />
          <NumberField
            label="Production buffer"
            value={buffer}
            onChange={setBuffer}
            required
            min="0"
            helpText="Reserved capacity — protected from normal bookings unless you release it"
          />
          <NumberField
            label="Default minimum notice (days)"
            value={minNotice}
            onChange={setMinNotice}
            required
            min="0"
            helpText="Used when a product does not set its own minimum notice"
          />
          <NumberField
            label="Maximum advance booking (days)"
            value={maxAdvance}
            onChange={setMaxAdvance}
            required
            min="1"
            helpText="How far ahead customers can book"
          />
        </div>

        <div className="mt-5 rounded-md bg-cream px-4 py-3 text-sm text-cocoa">
          Bookable capacity after buffer:{" "}
          <span className="font-semibold">
            {bookableCapacity >= 0 ? bookableCapacity : 0} units/week
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-cocoa">
          Daily distribution
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          How the weekly total is spread across operating days. Close a day
          entirely if the bakery does not produce that day.
        </p>

        <div className="mt-5 space-y-2">
          {dailyAllocations.map((day, index) => (
            <div
              key={day.weekday}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-md border border-border px-4 py-3"
            >
              <span className="text-sm font-medium text-text-primary">
                {WEEKDAY_LABELS[day.weekday]}
              </span>
              <input
                type="number"
                min="0"
                value={day.allocatedUnits}
                disabled={day.isClosed}
                onChange={(event) =>
                  updateDay(index, { allocatedUnits: event.target.value })
                }
                className="w-24 rounded-md border border-border bg-page-bg px-2.5 py-1.5 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa disabled:opacity-50"
              />
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-text-secondary">
                <input
                  type="checkbox"
                  checked={day.isClosed}
                  onChange={(event) =>
                    updateDay(index, { isClosed: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-border text-cocoa focus:ring-cocoa"
                />
                Closed
              </label>
            </div>
          ))}
        </div>

        <div
          className={`mt-4 rounded-md px-4 py-3 text-sm ${
            totalExceedsWeekly
              ? "bg-error/10 text-error"
              : "bg-page-bg text-text-secondary"
          }`}
        >
          Allocated total: {allocatedTotal} / {weeklyMaxNumber} weekly units
          {totalExceedsWeekly &&
            " — this exceeds your weekly capacity and will not save."}
        </div>
      </section>

      {error && (
        <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || totalExceedsWeekly}
        className="rounded-md bg-cocoa px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cocoa/90 disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : "Save capacity settings"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required,
  min,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
  helpText?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min}
        className="mt-1 w-full rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
      />
      {helpText && (
        <p className="mt-1 text-xs text-text-secondary">{helpText}</p>
      )}
    </div>
  );
}
