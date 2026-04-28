/**
 * Currency, date, and number formatters.
 *
 * Always format on the server when possible — locale-stable, no hydration
 * mismatches. Use the cents-aware helpers (never `toFixed(2)` on a divided
 * float — rounding errors compound on totals).
 */

const CAD = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents: number): string {
  return CAD.format(cents / 100);
}

export function formatCentsCompact(cents: number): string {
  // For dashboard tiles: $1.2k, $14.5k, $1.4M
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (Math.abs(dollars) >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return CAD.format(dollars);
}

const longDate = new Intl.DateTimeFormat("en-CA", {
  weekday: "long",
  month: "long",
  day: "numeric",
});
const shortDate = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" });
const dayName = new Intl.DateTimeFormat("en-CA", { weekday: "short" });
const time = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });

export function formatDate(d: Date | string): string {
  return longDate.format(typeof d === "string" ? new Date(d) : d);
}
export function formatDateShort(d: Date | string): string {
  return shortDate.format(typeof d === "string" ? new Date(d) : d);
}
export function formatDayName(d: Date | string): string {
  return dayName.format(typeof d === "string" ? new Date(d) : d);
}
export function formatTime(d: Date | string): string {
  return time.format(typeof d === "string" ? new Date(d) : d);
}

/** Human "2h ago", "3d ago" relative formatter. */
export function formatRelative(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDateShort(date);
}

/** Signed percentage delta with arrow + sign. */
export function formatTrend(current: number, previous: number): {
  label: string;
  direction: "up" | "down" | "flat";
} {
  if (previous === 0) {
    if (current === 0) return { label: "—", direction: "flat" };
    return { label: "new", direction: "up" };
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 1) return { label: "0%", direction: "flat" };
  const sign = pct > 0 ? "+" : "";
  const direction = pct > 0 ? "up" : "down";
  return { label: `${sign}${pct.toFixed(0)}%`, direction };
}
