// Design System §6 "Status Indicators" calls for clear badges across a
// fixed vocabulary (Available, Pending, Confirmed, In production,
// Completed, Closed). This component is the one place that vocabulary's
// color mapping lives, so every screen that shows a status — Production
// Overview, product active/inactive, complexity level — draws from the
// same palette rather than each screen inventing its own badge colors.
type BadgeTone = "success" | "warning" | "error" | "neutral" | "cocoa";

const TONE_STYLES: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  neutral: "bg-border/40 text-text-secondary",
  cocoa: "bg-cream text-cocoa",
};

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      {label}
    </span>
  );
}
