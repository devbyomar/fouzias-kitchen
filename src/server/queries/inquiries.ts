/**
 * Server-only queries for the Inquiries section.
 */

import "server-only";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { inquiries, orders } from "@/db/schema";

export type InquiryStatus = "new" | "responded" | "archived";

export type InquiryListFilters = {
  status?: InquiryStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listInquiries(filters: InquiryListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const where = and(
    filters.status && filters.status !== "all"
      ? eq(inquiries.status, filters.status)
      : undefined,
    filters.search
      ? or(
          ilike(inquiries.rawName, `%${filters.search}%`),
          ilike(inquiries.rawEmail, `%${filters.search}%`),
          ilike(inquiries.message, `%${filters.search}%`),
        )
      : undefined,
  );

  const rows = await db
    .select({
      id: inquiries.id,
      rawName: inquiries.rawName,
      rawEmail: inquiries.rawEmail,
      rawPhone: inquiries.rawPhone,
      rawDate: inquiries.rawDate,
      message: inquiries.message,
      status: inquiries.status,
      convertedOrderId: inquiries.convertedOrderId,
      createdAt: inquiries.createdAt,
    })
    .from(inquiries)
    .where(where)
    .orderBy(desc(inquiries.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [totalRow] = await db.select({ c: count(inquiries.id) }).from(inquiries).where(where);

  return {
    rows,
    total: Number(totalRow?.c ?? 0),
    page,
    pageSize,
  };
}

export async function getInquiryById(id: string) {
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, id))
    .limit(1);
  if (!inquiry) return null;

  let convertedOrderNumber: number | null = null;
  if (inquiry.convertedOrderId) {
    const [o] = await db
      .select({ number: orders.number })
      .from(orders)
      .where(eq(orders.id, inquiry.convertedOrderId))
      .limit(1);
    convertedOrderNumber = o?.number ?? null;
  }

  return { inquiry, convertedOrderNumber };
}
