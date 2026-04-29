/**
 * Server-only queries for the Orders section.
 *
 * Lists are paginated via offset/limit (cursor pagination is overkill for
 * the volumes we expect — a single owner-operated bakery). All filters are
 * applied in SQL so we never load the full table.
 */

import "server-only";
import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  orderItems,
  orders,
  products,
  statusEvents,
  users,
} from "@/db/schema";

export type OrderListFilters = {
  status?: "open" | "new" | "confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled";
  payment?: "unpaid" | "pending" | "paid" | "refunded" | "failed";
  range?: "today" | "week" | "month" | "all";
  search?: string; // matches order number, customer name, email
  page?: number;
  pageSize?: number;
};

export type OrderListRow = {
  id: string;
  number: number;
  customerName: string;
  customerEmail: string | null;
  fulfillmentType: "pickup" | "delivery";
  requestedDate: Date;
  status: "new" | "confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled";
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded" | "failed";
  totalCents: number;
  createdAt: Date;
};

export type OrderListResult = {
  rows: OrderListRow[];
  total: number;
  page: number;
  pageSize: number;
};

function rangeStart(range: OrderListFilters["range"]): Date | null {
  if (!range || range === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "today") return d;
  if (range === "week") {
    d.setDate(d.getDate() - 7);
    return d;
  }
  // month
  d.setDate(d.getDate() - 30);
  return d;
}

export async function listOrders(filters: OrderListFilters = {}): Promise<OrderListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const where = and(
    filters.status === "open"
      ? sql`${orders.status} in ('new','confirmed','in_prep','ready')`
      : filters.status
        ? eq(orders.status, filters.status)
        : undefined,
    filters.payment ? eq(orders.paymentStatus, filters.payment) : undefined,
    (() => {
      const start = rangeStart(filters.range);
      return start ? gte(orders.createdAt, start) : undefined;
    })(),
    filters.search
      ? or(
          ilike(customers.name, `%${filters.search}%`),
          ilike(customers.email, `%${filters.search}%`),
          // numeric search on order number — only when the term is digits
          /^\d+$/.test(filters.search) ? eq(orders.number, Number(filters.search)) : undefined,
        )
      : undefined,
  );

  const rows = await db
    .select({
      id: orders.id,
      number: orders.number,
      customerName: customers.name,
      customerEmail: customers.email,
      fulfillmentType: orders.fulfillmentType,
      requestedDate: orders.requestedDate,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [totalRow] = await db
    .select({ c: count(orders.id) })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(where);

  return {
    rows,
    total: Number(totalRow?.c ?? 0),
    page,
    pageSize,
  };
}

export type OrderDetail = Awaited<ReturnType<typeof getOrderById>>;

export async function getOrderById(id: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  if (!order) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1);

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productName: products.nameEn,
      quantity: orderItems.quantity,
      unitPriceCents: orderItems.unitPriceCents,
      lineNotes: orderItems.lineNotes,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, id));

  const events = await db
    .select({
      id: statusEvents.id,
      fromStatus: statusEvents.fromStatus,
      toStatus: statusEvents.toStatus,
      note: statusEvents.note,
      actorEmail: users.email,
      createdAt: statusEvents.createdAt,
    })
    .from(statusEvents)
    .leftJoin(users, eq(users.id, statusEvents.actorId))
    .where(eq(statusEvents.orderId, id))
    .orderBy(asc(statusEvents.createdAt));

  return { order, customer: customer ?? null, items, events };
}

/** Status transitions allowed from a given state. Mirrors §6.2 of spec. */
export function allowedNextStatuses(
  status: "new" | "confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled",
): Array<"confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled"> {
  switch (status) {
    case "new":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["in_prep", "cancelled"];
    case "in_prep":
      return ["ready", "cancelled"];
    case "ready":
      return ["fulfilled", "cancelled"];
    case "fulfilled":
    case "cancelled":
      return [];
  }
}
