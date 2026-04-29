/**
 * Audit log helper.
 *
 * Every owner-side mutation funnels through `recordAudit` so we have a
 * tamper-evident trail of who changed what, and when. The diff is stored
 * as JSONB so we can query by entity + action and render a per-entity
 * timeline in the audit viewer.
 *
 * Keep this module dependency-light — it should not throw and disrupt the
 * primary write that triggered it. Failures are logged and swallowed.
 */

import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditEntity =
  | "order"
  | "inquiry"
  | "customer"
  | "product"
  | "inventory"
  | "setting"
  | "user";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "payment_update"
  | "refund"
  | "convert"
  | "archive"
  | "restore"
  | "sign_in"
  | "sign_out";

export async function recordAudit(input: {
  actorId: string | null;
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  diff?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId,
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      diff: input.diff ?? null,
    });
  } catch (err) {
    // Never let audit failures break the originating write.
    // eslint-disable-next-line no-console
    console.error("[audit] failed to record", { input, err });
  }
}
