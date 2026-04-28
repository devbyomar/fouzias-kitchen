/**
 * Server-only dashboard queries.
 *
 * All numbers come straight out of Postgres so the dashboard never lies. Each
 * function is small, focused, and returns plain serializable data the React
 * server component can render without any additional shaping.
 *
 * Date math uses the server's local TZ. Toronto is the operating timezone and
 * Vercel is configured for it; if we ever expand we'll pin a TZ here.
 */

import "server-only";
import { and, asc, count, desc, eq, gte, lt, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  inquiries,
  orderItems,
  orders,
  products,
} from "@/db/schema";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export type DashboardSummary = {
  todayOrderCount: number;
  todayRevenueCents: number;
  weekOrderCount: number;
  weekRevenueCents: number;
  prevWeekOrderCount: number;
  prevWeekRevenueCents: number;
  openOrderCount: number;
  newInquiryCount: number;
  unpaidOrderCount: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekAgo = addDays(today, -7);
  const twoWeeksAgo = addDays(today, -14);

  const [todayRow] = await db
    .select({
      c: count(orders.id),
      sum: sum(orders.totalCents).mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, today),
        lt(orders.createdAt, tomorrow),
        ne(orders.status, "cancelled"),
      ),
    );

  const [weekRow] = await db
    .select({
      c: count(orders.id),
      sum: sum(orders.totalCents).mapWith(Number),
    })
    .from(orders)
    .where(and(gte(orders.createdAt, weekAgo), ne(orders.status, "cancelled")));

  const [prevWeekRow] = await db
    .select({
      c: count(orders.id),
      sum: sum(orders.totalCents).mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, twoWeeksAgo),
        lt(orders.createdAt, weekAgo),
        ne(orders.status, "cancelled"),
      ),
    );

  const [openRow] = await db
    .select({ c: count(orders.id) })
    .from(orders)
    .where(
      sql`${orders.status} in ('new','confirmed','in_prep','ready')`,
    );

  const [inquiryRow] = await db
    .select({ c: count(inquiries.id) })
    .from(inquiries)
    .where(eq(inquiries.status, "new"));

  const [unpaidRow] = await db
    .select({ c: count(orders.id) })
    .from(orders)
    .where(
      and(
        sql`${orders.paymentStatus} in ('unpaid','pending','failed')`,
        ne(orders.status, "cancelled"),
      ),
    );

  return {
    todayOrderCount: Number(todayRow?.c ?? 0),
    todayRevenueCents: Number(todayRow?.sum ?? 0),
    weekOrderCount: Number(weekRow?.c ?? 0),
    weekRevenueCents: Number(weekRow?.sum ?? 0),
    prevWeekOrderCount: Number(prevWeekRow?.c ?? 0),
    prevWeekRevenueCents: Number(prevWeekRow?.sum ?? 0),
    openOrderCount: Number(openRow?.c ?? 0),
    newInquiryCount: Number(inquiryRow?.c ?? 0),
    unpaidOrderCount: Number(unpaidRow?.c ?? 0),
  };
}

export type UpcomingFulfillment = {
  id: string;
  number: number;
  customerName: string;
  fulfillmentType: "pickup" | "delivery";
  requestedDate: Date;
  requestedTime: string | null;
  status: "new" | "confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled";
  totalCents: number;
};

export async function getUpcomingFulfillments(days = 7): Promise<UpcomingFulfillment[]> {
  const today = startOfDay(new Date());
  const horizon = addDays(today, days);

  const rows = await db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: customers.name,
      fulfillmentType: orders.fulfillmentType,
      requestedDate: orders.requestedDate,
      requestedTime: orders.requestedTime,
      status: orders.status,
      totalCents: orders.totalCents,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(
      and(
        gte(orders.requestedDate, today),
        lt(orders.requestedDate, horizon),
        ne(orders.status, "cancelled"),
        ne(orders.status, "fulfilled"),
      ),
    )
    .orderBy(asc(orders.requestedDate), asc(orders.requestedTime))
    .limit(20);

  return rows;
}

export type RevenuePoint = { date: string; revenueCents: number; orderCount: number };

/** Daily revenue series for the last N days (oldest first). Includes zero days. */
export async function getRevenueSeries(days = 14): Promise<RevenuePoint[]> {
  const today = startOfDay(new Date());
  const start = addDays(today, -(days - 1));

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sum(orders.totalCents).mapWith(Number),
      c: count(orders.id),
    })
    .from(orders)
    .where(and(gte(orders.createdAt, start), ne(orders.status, "cancelled")))
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`);

  const map = new Map<string, (typeof rows)[number]>(rows.map((r) => [r.day, r]));
  const out: RevenuePoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    out.push({
      date: key,
      revenueCents: Number(row?.revenue ?? 0),
      orderCount: Number(row?.c ?? 0),
    });
  }
  return out;
}

export type TopProduct = {
  productId: string;
  nameEn: string;
  unitsSold: number;
  revenueCents: number;
};

export async function getTopProducts(days = 30, limit = 5): Promise<TopProduct[]> {
  const start = addDays(startOfDay(new Date()), -days);

  const rows = await db
    .select({
      productId: orderItems.productId,
      nameEn: products.nameEn,
      unitsSold: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
      revenueCents: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceCents})`.mapWith(
        Number,
      ),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(and(gte(orders.createdAt, start), ne(orders.status, "cancelled")))
    .groupBy(orderItems.productId, products.nameEn)
    .orderBy(desc(sql`sum(${orderItems.quantity} * ${orderItems.unitPriceCents})`))
    .limit(limit);

  return rows;
}

export type RecentInquiry = {
  id: string;
  rawName: string;
  rawEmail: string;
  message: string;
  createdAt: Date;
};

export async function getRecentInquiries(limit = 5): Promise<RecentInquiry[]> {
  return db
    .select({
      id: inquiries.id,
      rawName: inquiries.rawName,
      rawEmail: inquiries.rawEmail,
      message: inquiries.message,
      createdAt: inquiries.createdAt,
    })
    .from(inquiries)
    .where(eq(inquiries.status, "new"))
    .orderBy(desc(inquiries.createdAt))
    .limit(limit);
}
