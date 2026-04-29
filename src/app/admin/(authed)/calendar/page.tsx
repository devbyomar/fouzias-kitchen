/**
 * Calendar — month view of orders due, with capacity controls.
 *
 * Renders a 6-row grid (Mon-first), shading days by load (orderCount /
 * capacityMax). Clicking a day opens a side panel with the orders due
 * that day plus a capacity editor.
 */

import Link from "next/link";
import { getCalendarMonth, getOrdersForDate, getDayCapacity } from "@/server/queries/calendar";
import { DayCapacityForm } from "@/components/admin/DayCapacityForm";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Calendar · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function parseMonth(s: string | undefined): { year: number; month: number } {
  if (typeof s === "string" && /^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split("-").map(Number);
    if (y && m && m >= 1 && m <= 12) return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { year, month } = parseMonth(typeof params.month === "string" ? params.month : undefined);
  const selectedDate = typeof params.date === "string" ? params.date : null;

  const monthData = await getCalendarMonth(year, month);
  const dayMap = new Map(monthData.days.map((d) => [d.date, d]));

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Mon-first grid: getUTCDay() is 0=Sun..6=Sat, we want Mon=0..Sun=6.
  const leading = (firstOfMonth.getUTCDay() + 6) % 7;
  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < leading; i++) cells.push({ day: null, key: `lead-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d-${d}` });
  while (cells.length % 7 !== 0) cells.push({ day: null, key: `tail-${cells.length}` });

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // Side-panel data for the selected day.
  let selectedDay: {
    date: string;
    orders: Awaited<ReturnType<typeof getOrdersForDate>>;
    capacity: Awaited<ReturnType<typeof getDayCapacity>>;
  } | null = null;
  if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    const date = new Date(`${selectedDate}T00:00:00.000Z`);
    const [orders, capacity] = await Promise.all([
      getOrdersForDate(date),
      getDayCapacity(date),
    ]);
    selectedDay = { date: selectedDate, orders, capacity };
  }

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">{monthLabel}</h1>
        </div>
        <div className="filters__row">
          <Link href={`/admin/calendar?month=${prev.year}-${String(prev.month).padStart(2, "0")}`} className="btn btn--ghost">← Prev</Link>
          <Link href="/admin/calendar" className="btn btn--ghost">Today</Link>
          <Link href={`/admin/calendar?month=${next.year}-${String(next.month).padStart(2, "0")}`} className="btn btn--ghost">Next →</Link>
        </div>
      </header>

      <div className={`calendar-layout ${selectedDay ? "calendar-layout--with-side" : ""}`}>
        <section className="panel calendar-panel">
          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="calendar-grid__head">{d}</div>
            ))}
            {cells.map((c) => {
              if (c.day == null) return <div key={c.key} className="calendar-cell calendar-cell--empty" />;
              const dateKey = ymd(year, month, c.day);
              const data = dayMap.get(dateKey);
              const load = data?.capacityMax ? Math.min(1, data.orderCount / data.capacityMax) : 0;
              const isSelected = dateKey === selectedDate;
              return (
                <Link
                  key={c.key}
                  href={`/admin/calendar?month=${year}-${String(month).padStart(2, "0")}&date=${dateKey}`}
                  className={`calendar-cell ${data?.blocked ? "calendar-cell--blocked" : ""} ${isSelected ? "calendar-cell--selected" : ""}`}
                  style={{
                    background: data?.blocked
                      ? undefined
                      : load > 0
                      ? `color-mix(in srgb, var(--admin-accent) ${Math.round(load * 35)}%, var(--admin-panel))`
                      : undefined,
                  }}
                >
                  <div className="calendar-cell__day">{c.day}</div>
                  {data && data.orderCount > 0 && (
                    <div className="calendar-cell__meta">
                      {data.orderCount} {data.orderCount === 1 ? "order" : "orders"}
                      <div className="calendar-cell__money">{formatCents(data.totalCents)}</div>
                    </div>
                  )}
                  {data?.blocked && <div className="calendar-cell__blocked">Blocked</div>}
                  {data?.capacityMax != null && data.capacityMax < 99 && (
                    <div className="calendar-cell__cap">cap {data.capacityMax}</div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {selectedDay && (
          <aside className="panel calendar-side">
            <h2 className="panel__title">
              {new Date(`${selectedDay.date}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <h3 className="panel__subhead">Day capacity</h3>
            <DayCapacityForm
              date={selectedDay.date}
              initial={
                selectedDay.capacity
                  ? {
                      maxOrders: selectedDay.capacity.maxOrders,
                      blocked: selectedDay.capacity.blocked,
                      blockReason: selectedDay.capacity.blockReason,
                    }
                  : null
              }
            />

            <h3 className="panel__subhead">Orders due ({selectedDay.orders.length})</h3>
            {selectedDay.orders.length === 0 ? (
              <p className="muted" style={{ fontSize: ".88rem" }}>No orders due this day.</p>
            ) : (
              <ul className="day-orders">
                {selectedDay.orders.map((o) => (
                  <li key={o.id} className="day-orders__row">
                    <Link href={`/admin/orders/${o.id}`} className="day-orders__num">#{o.number}</Link>
                    <span className="day-orders__name">{o.customerName}</span>
                    <span className={`pill pill--${o.status}`}>{o.status.replace("_", " ")}</span>
                    <span className="day-orders__total">{formatCents(o.totalCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
