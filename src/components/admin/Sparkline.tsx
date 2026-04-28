/**
 * Tiny inline SVG sparkline. Pure server component, no deps. Recharts is
 * reserved for the full Analytics page; the dashboard only needs a hint.
 */

export function Sparkline({
  values,
  width = 220,
  height = 48,
  ariaLabel,
}: {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel: string;
}) {
  if (values.length === 0) {
    return (
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#ECE3D2" strokeWidth={2} />
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel}>
      <polygon points={areaPoints} fill="#5A3A20" fillOpacity={0.08} />
      <polyline points={points} fill="none" stroke="#5A3A20" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
