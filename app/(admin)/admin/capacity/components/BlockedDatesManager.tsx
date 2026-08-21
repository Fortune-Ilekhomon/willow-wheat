"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBlockedDate, removeBlockedDate } from "@/lib/admin/capacity";

interface BlockedDateRow {
  id: string;
  date: string; // ISO date string, already formatted server-side
  reason: string | null;
}

// Separate from the weekly daily-allocation pattern above by design — per
// the schema comment, this is for ad hoc closures (a single holiday, a
// family event) that should not require editing the standing weekly
// schedule. Rules doc §7 groups this under order-closing rules generally;
// this is the manual, exception-based half of that, as opposed to the
// Capacity Engine's automatic closure once units run out.
export function BlockedDatesManager({
  initialDates,
}: {
  initialDates: BlockedDateRow[];
}) {
  const router = useRouter();
  const [dates, setDates] = useState(initialDates);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!newDate) {
      setError("Choose a date to block.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addBlockedDate({
        date: new Date(newDate),
        reason: newReason || undefined,
      });
      setDates((current) =>
        [
          ...current,
          {
            id: created.id,
            // Server Actions preserve Date objects across the server-to-
            // client boundary (unlike a JSON API route, where this would
            // already be a string) — .toISOString() explicitly, so this
            // matches the ISO string format the initial server-rendered
            // list already uses, keeping the localeCompare sort below
            // correct either way.
            date: created.date.toISOString(),
            reason: created.reason,
          },
        ].sort((a, b) => a.date.localeCompare(b.date))
      );
      setNewDate("");
      setNewReason("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add that date. It may already be blocked."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    setDates((current) => current.filter((date) => date.id !== id));
    await removeBlockedDate(id);
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-cocoa">
        Blocked dates
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Holidays or one-off closures. No production is scheduled on these
        dates regardless of remaining weekly capacity.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto]"
      >
        <input
          type="date"
          value={newDate}
          onChange={(event) => setNewDate(event.target.value)}
          className="rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
        />
        <input
          type="text"
          value={newReason}
          onChange={(event) => setNewReason(event.target.value)}
          placeholder="Reason (optional)"
          className="rounded-md border border-border bg-page-bg px-3 py-2 text-sm text-text-primary focus:border-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md border border-cocoa px-4 py-2 text-sm font-medium text-cocoa transition hover:bg-cream disabled:opacity-60"
        >
          Block date
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      {dates.length > 0 && (
        <ul className="mt-5 divide-y divide-border">
          {dates.map((date) => (
            <li
              key={date.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <span className="font-medium text-text-primary">
                  {new Date(date.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {date.reason && (
                  <span className="ml-2 text-text-secondary">
                    {date.reason}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(date.id)}
                className="text-sm font-medium text-error underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
