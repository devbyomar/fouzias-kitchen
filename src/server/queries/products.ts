/**
 * Server-only queries for the Products section.
 */

import "server-only";
import { and, asc, count, desc, eq, gte, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { inventory, products } from "@/db/schema";

export type ProductListFilters = {
  search?: string;
  status?: "all" | "active" | "archived";
  page?: number;
  pageSize?: number;
};

export type ProductListRow = typeof products.$inferSelect;

export async function listProducts(filters: ProductListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const status = filters.status ?? "all";

  const conditions = [] as Array<ReturnType<typeof eq>>;
  if (status === "active") conditions.push(eq(products.active, true));
  if (status === "archived") conditions.push(eq(products.active, false));
  if (filters.search?.trim()) {
    conditions.push(
      or(
        ilike(products.nameEn, `%${filters.search.trim()}%`),
        ilike(products.slug, `%${filters.search.trim()}%`),
        ilike(products.nameTraditional, `%${filters.search.trim()}%`),
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(asc(products.sortOrder), asc(products.nameEn))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(products).where(where),
  ]);

  return {
    rows,
    total: Number(totalRow[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export async function getProductById(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;

  // Inventory for the next 30 days. Only show dates the owner has set or that
  // are imminent — this keeps the editor focused.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.productId, id), gte(inventory.date, today)))
    .orderBy(asc(inventory.date))
    .limit(60);

  return { product, inventory: upcoming };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return product ?? null;
}
