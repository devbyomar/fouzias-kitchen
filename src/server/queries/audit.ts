/**
 * Server-only audit log queries.
 */

import "server-only";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";

export type AuditFilters = {
  entity?: string;
  actorId?: string;
  search?: string; // matches entityId or action
  page?: number;
  pageSize?: number;
};

export async function listAuditLogs(filters: AuditFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  const conditions = [] as Array<ReturnType<typeof eq>>;
  if (filters.entity) conditions.push(eq(auditLogs.entity, filters.entity));
  if (filters.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
  if (filters.search?.trim()) {
    conditions.push(
      or(
        ilike(auditLogs.entityId, `%${filters.search.trim()}%`),
        ilike(auditLogs.action, `%${filters.search.trim()}%`),
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        actorId: auditLogs.actorId,
        actorEmail: users.email,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        diff: auditLogs.diff,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(auditLogs).where(where),
  ]);

  return {
    rows,
    total: Number(totalRow[0]?.value ?? 0),
    page,
    pageSize,
  };
}

export async function listAuditEntities() {
  const rows = await db
    .selectDistinct({ entity: auditLogs.entity })
    .from(auditLogs)
    .orderBy(auditLogs.entity);
  return rows.map((r) => r.entity);
}
