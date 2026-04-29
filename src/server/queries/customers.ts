/**
 * Server-only queries for the Customers section.
 *
 * Customers are derived from the people who placed orders or sent inquiries.
 * The list view shows aggregate stats (lifetime orders + spend) computed in
 * SQL so we never have to walk the orders table client-side.
 */

import "server-only";
import { and, count, desc, eq, ilike, or, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { customers, inquiries, orders } from "@/db/schema";

export type CustomerListFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CustomerListRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  totalOrders: number;
  totalSpentCents: number;
  lastOrderAt: Date | null;
  createdAt: Date;
};

export type CustomerListResult = {
  rows: CustomerListRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listCustomers(
  filters: CustomerListFilters = {},
): Promise<CustomerListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const where =
    filters.search && filters.search.trim()
      ? or(
          ilike(customers.name, `%${filters.search.trim()}%`),
          ilike(customers.email, `%${filters.search.trim()}%`),
          ilike(customers.phone, `%${filters.search.trim()}%`),
        )
      : undefined;

  // Aggregate orders per customer in a sub-select then join.
  const stats = db
    .select({
      customerId: orders.customerId,
      totalOrders: count(orders.id).as("total_orders"),
      // Only paid revenue counts toward lifetime spend. Cancelled orders
      // shouldn't inflate the number even if they exist in the table.
      totalSpentCents: sql<number>`coalesce(sum(case when ${orders.paymentStatus} in ('paid','refunded') then ${orders.amountPaidCents} - ${orders.refundedCents} else 0 end), 0)`.as(
        "total_spent_cents",
      ),
      lastOrderAt: sql<Date | null>`max(${orders.createdAt})`.as("last_order_at"),
    })
    .from(orders)
    .groupBy(orders.customerId)
    .as("stats");

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        tags: customers.tags,
        createdAt: customers.createdAt,
        totalOrders: sql<number>`coalesce(${stats.totalOrders}, 0)`,
        totalSpentCents: sql<number>`coalesce(${stats.totalSpentCents}, 0)`,
        lastOrderAt: stats.lastOrderAt,
      })
      .from(customers)
      .leftJoin(stats, eq(stats.customerId, customers.id))
      .where(where)
      .orderBy(desc(sql`coalesce(${stats.lastOrderAt}, ${customers.createdAt})`))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(customers).where(where),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      tags: r.tags,
      totalOrders: Number(r.totalOrders ?? 0),
      totalSpentCents: Number(r.totalSpentCents ?? 0),
      lastOrderAt: r.lastOrderAt,
      createdAt: r.createdAt,
    })),
    total: Number(totalRow[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export type CustomerDetail = {
  customer: typeof customers.$inferSelect;
  orderHistory: Array<{
    id: string;
    number: number;
    status: string;
    paymentStatus: string;
    totalCents: number;
    requestedDate: Date;
    createdAt: Date;
  }>;
  inquiryHistory: Array<{
    id: string;
    subject: string | null;
    status: string;
    createdAt: Date;
  }>;
  stats: {
    totalOrders: number;
    totalSpentCents: number;
    avgOrderCents: number;
    firstOrderAt: Date | null;
    lastOrderAt: Date | null;
  };
};

export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) return null;

  const [orderHistory, inquiryHistory] = await Promise.all([
    db
      .select({
        id: orders.id,
        number: orders.number,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalCents: orders.totalCents,
        requestedDate: orders.requestedDate,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(50),
    // Inquiries link to customers via customerId. We surface the first line
    // of the message as a "subject" preview for the customer detail page.
    db
      .select({
        id: inquiries.id,
        subject: inquiries.message,
        status: inquiries.status,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(eq(inquiries.customerId, id))
      .orderBy(desc(inquiries.createdAt))
      .limit(50),
  ]);

  const paid = orderHistory.filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "refunded");
  const totalSpentCents = paid.reduce((s, o) => s + o.totalCents, 0);

  return {
    customer,
    orderHistory,
    inquiryHistory,
    stats: {
      totalOrders: orderHistory.length,
      totalSpentCents,
      avgOrderCents: paid.length ? Math.round(totalSpentCents / paid.length) : 0,
      firstOrderAt: orderHistory.length ? orderHistory[orderHistory.length - 1]!.createdAt : null,
      lastOrderAt: orderHistory.length ? orderHistory[0]!.createdAt : null,
    },
  };
}
