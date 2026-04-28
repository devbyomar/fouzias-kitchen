/**
 * Compact stat card used across the dashboard. Server component — receives
 * pre-formatted strings so no client JS ships for these tiles.
 */

export function StatCard({
  label,
  value,
  hint,
  trend,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { label: string; direction: "up" | "down" | "flat" };
  href?: string;
}) {
  const body = (
    <>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__foot">
        {trend && (
          <span className={`stat-card__trend stat-card__trend--${trend.direction}`}>
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "–"} {trend.label}
          </span>
        )}
        {hint && <span className="stat-card__hint">{hint}</span>}
      </div>
    </>
  );
  if (href) {
    return (
      <a className="stat-card" href={href}>
        {body}
      </a>
    );
  }
  return <div className="stat-card">{body}</div>;
}
