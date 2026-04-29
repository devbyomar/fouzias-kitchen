"use server";

/**
 * Day-capacity actions. Used from the calendar's per-day side panel.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { dayCapacity } from "@/db/schema";
import { recordAudit } from "@/server/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setDayCapacity(input: {
  date: string; // yyyy-mm-dd
  maxOrders: number;
  blocked: boolean;
  blockReason?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  if (!Number.isInteger(input.maxOrders) || input.maxOrders < 0) {
    return { ok: false, error: "Max orders must be 0 or more" };
  }
  const date = new Date(`${input.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Invalid date" };

  const [existing] = await db.select().from(dayCapacity).where(eq(dayCapacity.date, date)).limit(1);

  if (existing) {
    await db
      .update(dayCapacity)
      .set({
        maxOrders: input.maxOrders,
        blocked: input.blocked,
        blockReason: input.blockReason?.trim() || null,
      })
      .where(eq(dayCapacity.date, date));
  } else {
    await db.insert(dayCapacity).values({
      date,
      maxOrders: input.maxOrders,
      blocked: input.blocked,
      blockReason: input.blockReason?.trim() || null,
    });
  }

  await recordAudit({
    actorId: session.user.id,
    entity: "setting",
    entityId: `day_capacity:${input.date}`,
    action: "update",
    diff: { after: input },
  });

  revalidatePath("/admin/calendar");
  return { ok: true };
}
