/**
 * Server-only analytics queries.
 *
 * Owner-grade numbers. We compute everything in SQL — no row-by-row JS math.
 * "Revenue" excludes cancelled orders and refunded amounts.
 */

import "server-only";
import { and, count, desc, eq, gte, lt, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

export type AnalyticsSummary = {
  rangeDays: number;
  rangeStart: Date;
  rangeEnd: Date;
  totalOrders: number;
  paidOrders: number;
  grossRevenueCents: number;
  netRevenueCents: number; // gross - refunds
  avgOrderCents: number;
  refundedCents: number;
  inquiriesCount: number;
  /** New customers in window (first order placed during window). */
  newCustomerCount: number;
  daily: Array<{ date: string; orderCount: number; revenueCents: number }>;
  topProducts: Array<{
    productId: string;
    name: string;
    units: number;
    revenueCents: number;
  }>;
};

import { customers, inquiries } from "@/db/schema";

export async function getAnalyticsSummary(rangeDays: number): Promise<AnalyticsSummary> {
  const days = Math.max(1, Math.min(365, rangeDays));
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const ordersInWindow = and(
    gte(orders.createdAt, start),
    lt(orders.createdAt, new Date(end.getTime() + 1)),
    ne(orders.status, "cancelled"),
  );

  const [totals] = await db
    .select({
      totalOrders: count(orders.id),
      paidOrders: sql<number>`sum(case when ${orders.paymentStatus} in ('paid','refunded') then 1 else 0 end)`,
      grossRevenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      refundedCents: sql<number>`coalesce(sum(${orders.refundedCents}), 0)`,
    })
    .from(orders)
    .where(ordersInWindow);

  const dailyRows = await db
    .select({
      date: sql<string>`to_char(${orders.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`.as("date"),
      orderCount: count(orders.id),
      revenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
    })
    .from(orders)
    .where(ordersInWindow)
    .groupBy(sql`to_char(${orders.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`);

  const topRows = await db
    .select({
      productId: orderItems.productId,
      name: products.nameEn,
      units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
      revenueCents: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(ordersInWindow)
    .groupBy(orderItems.productId, products.nameEn)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)`))
    .limit(10);

  const [inquiryTotals] = await db
    .select({ value: count(inquiries.id) })
    .from(inquiries)
    .where(and(gte(inquiries.createdAt, start), lt(inquiries.createdAt, new Date(end.getTime() + 1))));

  const [newCustomers] = await db
    .select({ value: count(customers.id) })
    .from(customers)
    .where(and(gte(customers.createdAt, start), lt(customers.createdAt, new Date(end.getTime() + 1))));

  const totalOrders = Number(totals?.totalOrders ?? 0);
  const paidOrders = Number(totals?.paidOrders ?? 0);
  const grossRevenueCents = Number(totals?.grossRevenueCents ?? 0);
  const refundedCents = Number(totals?.refundedCents ?? 0);

  return {
    rangeDays: days,
    rangeStart: start,
    rangeEnd: end,
    totalOrders,
    paidOrders,
    grossRevenueCents,
    netRevenueCents: grossRevenueCents - refundedCents,
    refundedCents,
    avgOrderCents: paidOrders > 0 ? Math.round(grossRevenueCents / paidOrders) : 0,
    inquiriesCount: Number(inquiryTotals?.value ?? 0),
    newCustomerCount: Number(newCustomers?.value ?? 0),
    daily: dailyRows.map((r) => ({
      date: r.date,
      orderCount: Number(r.orderCount),
      revenueCents: Number(r.revenueCents),
    })),
    topProducts: topRows.map((r) => ({
      productId: r.productId,
      name: r.name,
      units: Number(r.units),
      revenueCents: Number(r.revenueCents),
    })),
  };
}
