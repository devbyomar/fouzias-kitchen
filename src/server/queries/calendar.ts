/**
 * Server-only queries for the Calendar / day-view.
 *
 * Surfaces each day's load: how many orders are due, gross dollars, and
 * the capacity record (max orders + blocked flag). The page renders a
 * monthly grid plus a focused "today/tomorrow" panel.
 */

import "server-only";
import { and, asc, count, eq, gte, lt, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { customers, dayCapacity, orders } from "@/db/schema";

export type CalendarDay = {
  date: string; // yyyy-mm-dd (UTC)
  orderCount: number;
  totalCents: number;
  capacityMax: number | null;
  blocked: boolean;
  blockReason: string | null;
};

export type CalendarMonth = {
  year: number;
  month: number; // 1-12
  start: Date;
  end: Date;
  days: CalendarDay[];
};

function startOfMonthUTC(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}
function startOfNextMonthUTC(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

export async function getCalendarMonth(year: number, month: number): Promise<CalendarMonth> {
  const start = startOfMonthUTC(year, month);
  const end = startOfNextMonthUTC(year, month);

  // Aggregate orders by requestedDate. Cancelled orders don't count toward
  // load — a cancelled order isn't real work.
  const orderRows = await db
    .select({
      date: orders.requestedDate,
      orderCount: count(orders.id).as("order_count"),
      totalCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`.as("total_cents"),
    })
    .from(orders)
    .where(
      and(
        gte(orders.requestedDate, start),
        lt(orders.requestedDate, end),
        ne(orders.status, "cancelled"),
      ),
    )
    .groupBy(orders.requestedDate);

  const capacityRows = await db
    .select()
    .from(dayCapacity)
    .where(and(gte(dayCapacity.date, start), lt(dayCapacity.date, end)));

  const map = new Map<string, CalendarDay>();
  for (const r of orderRows) {
    const key = r.date.toISOString().slice(0, 10);
    map.set(key, {
      date: key,
      orderCount: Number(r.orderCount),
      totalCents: Number(r.totalCents),
      capacityMax: null,
      blocked: false,
      blockReason: null,
    });
  }
  for (const c of capacityRows) {
    const key = c.date.toISOString().slice(0, 10);
    const existing = map.get(key) ?? {
      date: key,
      orderCount: 0,
      totalCents: 0,
      capacityMax: null,
      blocked: false,
      blockReason: null,
    };
    existing.capacityMax = c.maxOrders;
    existing.blocked = c.blocked;
    existing.blockReason = c.blockReason;
    map.set(key, existing);
  }

  const days = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  return { year, month, start, end, days };
}

export async function getOrdersForDate(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: customers.name,
      fulfillmentType: orders.fulfillmentType,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalCents: orders.totalCents,
      requestedTime: orders.requestedTime,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(gte(orders.requestedDate, start), lt(orders.requestedDate, end)))
    .orderBy(asc(orders.requestedTime), asc(orders.createdAt));
}

export async function getDayCapacity(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const [row] = await db.select().from(dayCapacity).where(eq(dayCapacity.date, start)).limit(1);
  return row ?? null;
}
