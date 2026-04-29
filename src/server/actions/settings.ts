"use server";

/**
 * Settings save action. Upserts each key independently so partial saves work
 * (and so adding new keys later doesn't blow away existing ones).
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { recordAudit } from "@/server/audit";
import { DEFAULT_SETTINGS, type SettingsShape } from "@/server/queries/settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveSettings(input: SettingsShape): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  // Numeric guards — JSON in, integer out.
  if (input.deliveryFeeCents < 0) return { ok: false, error: "Delivery fee can't be negative" };
  if (input.freeDeliveryThresholdCents < 0) return { ok: false, error: "Threshold can't be negative" };
  if (input.taxRateBps < 0 || input.taxRateBps > 5000)
    return { ok: false, error: "Tax rate looks wrong (use basis points, e.g. 1300 = 13%)" };
  if (input.defaultLeadTimeDays < 0) return { ok: false, error: "Lead time can't be negative" };
  if (!input.storeName.trim()) return { ok: false, error: "Store name is required" };

  const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof SettingsShape>;
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const key of keys) {
      const value = input[key];
      const [existing] = await tx
        .select({ key: settings.key })
        .from(settings)
        .where(eq(settings.key, key as string))
        .limit(1);
      if (existing) {
        await tx
          .update(settings)
          .set({ value, updatedAt: now })
          .where(eq(settings.key, key as string));
      } else {
        await tx.insert(settings).values({ key: key as string, value, updatedAt: now });
      }
    }
  });

  await recordAudit({
    actorId: session.user.id,
    entity: "setting",
    entityId: "store",
    action: "update",
    diff: { after: input },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true };
}
