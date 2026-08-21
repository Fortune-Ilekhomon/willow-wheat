import { getSession } from "@/lib/auth/getSession";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "./components/StatusBadge";

// This replaces the Phase 1 placeholder now that Products and Capacity
// Settings have real admin screens to source data from. It answers the
// specific business question the Build Framework's Dashboard Overview
// section names directly: "how much workload is booked against how much
// capacity, right now" — not a generic list of recent activity.
//
// No live Order data exists yet (Phase 3), so weekly booked workload is
// necessarily 0 for now. The page is built to compute it correctly the
// moment ProductionSchedule rows exist, rather than being rebuilt later —
// see the comment inline at the workload calculation below.
export default async function AdminHomePage() {
  const session = await getSession();

  if (!session || session.accountType !== "ADMIN") {
    redirect("/admin/login");
  }

  const [admin, capacitySettings, productCount, activeProductCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        include: { adminProfile: true },
      }),
      prisma.capacitySettings.findFirst({
        where: { effectiveTo: null },
        include: { dailyAllocations: { orderBy: { weekday: "asc" } } },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
    ]);

  // Booked workload for the current week = sum of totalProductionUnits
  // across OrderItems whose ProductionSchedule falls in this week and
  // whose Order is not cancelled. That query is correct today, it will
  // just always return 0 until Phase 3 creates orders — intentionally
  // built against the real schema now rather than stubbed with a fake
  // number, so this page does not need rework when orders exist.
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const scheduledThisWeek = await prisma.productionSchedule.findMany({
    where: {
      productionStartDate: { gte: startOfWeek, lt: endOfWeek },
      order: { status: { not: "CANCELLED" } },
    },
    include: { order: { include: { items: true } } },
  });

  const bookedUnitsThisWeek = scheduledThisWeek.reduce((sum, schedule) => {
    const orderUnits = schedule.order.items.reduce(
      (itemSum, item) => itemSum + item.totalProductionUnits,
      0
    );
    return sum + orderUnits;
  }, 0);

  const weeklyMax = capacitySettings?.maxWeeklyProductionUnits ?? 0;
  const buffer = capacitySettings?.productionBufferUnits ?? 0;
  const bookableCapacity = weeklyMax - buffer;
  const remainingCapacity = Math.max(bookableCapacity - bookedUnitsThisWeek, 0);
  const capacityPercentUsed =
    bookableCapacity > 0
      ? Math.min((bookedUnitsThisWeek / bookableCapacity) * 100, 100)
      : 0;

  const capacityStatus: { label: string; tone: "success" | "warning" | "error" } =
    !capacitySettings
      ? { label: "Not configured", tone: "error" }
      : capacityPercentUsed >= 100
        ? { label: "Full", tone: "error" }
        : capacityPercentUsed >= 80
          ? { label: "Near capacity", tone: "warning" }
          : { label: "Open", tone: "success" };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cocoa">
            Production Overview
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back, {admin?.name}. This is this week&apos;s workload
            against your configured capacity.
          </p>
        </div>
        <StatusBadge label={capacityStatus.label} tone={capacityStatus.tone} />
      </div>

      {!capacitySettings ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-text-secondary">
            Capacity has not been configured yet. Set your weekly production
            limit and buffer before products can be scheduled against real
            availability.
          </p>
          <Link
            href="/admin/capacity"
            className="mt-4 inline-block rounded-md bg-cocoa px-4 py-2 text-sm font-medium text-white transition hover:bg-cocoa/90"
          >
            Configure capacity
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <OverviewCard
            label="Booked this week"
            value={`${bookedUnitsThisWeek} units`}
            sublabel={`of ${bookableCapacity} bookable`}
          />
          <OverviewCard
            label="Remaining capacity"
            value={`${remainingCapacity} units`}
            sublabel="before this week closes"
          />
          <OverviewCard
            label="Protected buffer"
            value={`${buffer} units`}
            sublabel="reserved, not bookable"
          />
        </div>
      )}

      {capacitySettings && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">
              Weekly capacity usage
            </span>
            <span className="text-text-secondary">
              {bookedUnitsThisWeek} / {bookableCapacity} units
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/40">
            <div
              className={`h-full rounded-full ${
                capacityPercentUsed >= 100
                  ? "bg-error"
                  : capacityPercentUsed >= 80
                    ? "bg-warning"
                    : "bg-success"
              }`}
              style={{ width: `${capacityPercentUsed}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-cocoa">
            Products
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {activeProductCount} active of {productCount} total
          </p>
          <Link
            href="/admin/products"
            className="mt-4 inline-block text-sm font-medium text-cocoa underline"
          >
            Manage products
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold text-cocoa">
            Capacity &amp; schedule
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {capacitySettings
              ? `${weeklyMax} units/week, ${buffer} unit buffer`
              : "Not yet configured"}
          </p>
          <Link
            href="/admin/capacity"
            className="mt-4 inline-block text-sm font-medium text-cocoa underline"
          >
            Adjust capacity settings
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-secondary">
          Order management, the production calendar, and custom request
          review are built in Phase 3, once customers can place orders
          against this configuration.
        </p>
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-cocoa">
        {value}
      </p>
      <p className="mt-1 text-xs text-text-secondary">{sublabel}</p>
    </div>
  );
}
