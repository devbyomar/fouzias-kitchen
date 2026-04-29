"use server";

/**
 * Server actions for the Customers section.
 *
 * Today the only mutation the owner needs is editing notes / tags / contact
 * fields on an existing customer. Customer rows are created automatically
 * by the order checkout flow and the inquiry-conversion flow.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { recordAudit } from "@/server/audit";

export type UpdateCustomerInput = {
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
  notes?: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateCustomer(input: UpdateCustomerInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required" };

  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  const notes = input.notes?.trim() || null;
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);

  const [before] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, input.customerId))
    .limit(1);
  if (!before) return { ok: false, error: "Customer not found" };

  await db
    .update(customers)
    .set({ name, email, phone, notes, tags, updatedAt: new Date() })
    .where(eq(customers.id, input.customerId));

  await recordAudit({
    actorId: session.user.id,
    entity: "customer",
    entityId: input.customerId,
    action: "update",
    diff: {
      before: {
        name: before.name,
        email: before.email,
        phone: before.phone,
        notes: before.notes,
        tags: before.tags,
      },
      after: { name, email, phone, notes, tags },
    },
  });

  revalidatePath(`/admin/customers/${input.customerId}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}
