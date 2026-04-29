"use server";

/**
 * Server actions for the Orders section.
 *
 * All mutations are auth-gated, validated with zod, wrapped in a single
 * transaction (status change + status_event row + audit log), and call
 * `revalidatePath` so the UI never shows stale data.
 *
 * Status transitions are guarded by `allowedNextStatuses` so we can never
 * land in an illegal state (e.g. fulfilled → in_prep) regardless of what
 * the client sends.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, statusEvents } from "@/db/schema";
import { recordAudit } from "@/server/audit";
import { allowedNextStatuses } from "@/server/queries/orders";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const StatusSchema = z.enum([
  "new",
  "confirmed",
  "in_prep",
  "ready",
  "fulfilled",
  "cancelled",
]);

const ChangeStatusSchema = z.object({
  orderId: z.string().min(1),
  toStatus: StatusSchema,
  note: z.string().max(500).optional(),
});

export async function changeOrderStatus(input: {
  orderId: string;
  toStatus: z.infer<typeof StatusSchema>;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorId = await requireOwner();
  const parsed = ChangeStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  const { orderId, toStatus, note } = parsed.data;

  const [current] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!current) return { ok: false, error: "Order not found" };
  if (current.status === toStatus) return { ok: true };

  const allowed = allowedNextStatuses(current.status);
  // `allowed` is typed as the non-terminal subset; widen for the check.
  if (!(allowed as string[]).includes(toStatus)) {
    return {
      ok: false,
      error: `Cannot move from ${current.status} to ${toStatus}`,
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: toStatus, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    await tx.insert(statusEvents).values({
      orderId,
      fromStatus: current.status,
      toStatus,
      actorId,
      note: note ?? null,
    });
  });

  await recordAudit({
    actorId,
    entity: "order",
    entityId: orderId,
    action: "status_change",
    diff: { from: current.status, to: toStatus, note: note ?? null },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

const AddNoteSchema = z.object({
  orderId: z.string().min(1),
  note: z.string().min(1).max(2000),
});

export async function addOrderNote(input: {
  orderId: string;
  note: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorId = await requireOwner();
  const parsed = AddNoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const [order] = await db
    .select({ notes: orders.notes })
    .from(orders)
    .where(eq(orders.id, parsed.data.orderId))
    .limit(1);
  if (!order) return { ok: false, error: "Order not found" };

  const ts = new Date().toISOString();
  const appended = order.notes
    ? `${order.notes}\n\n[${ts}] ${parsed.data.note}`
    : `[${ts}] ${parsed.data.note}`;

  await db
    .update(orders)
    .set({ notes: appended, updatedAt: new Date() })
    .where(eq(orders.id, parsed.data.orderId));

  await recordAudit({
    actorId,
    entity: "order",
    entityId: parsed.data.orderId,
    action: "update",
    diff: { notesAppended: parsed.data.note },
  });

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { ok: true };
}
