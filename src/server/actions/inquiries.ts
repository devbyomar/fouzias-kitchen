"use server";

/**
 * Server actions for the Inquiries section.
 *
 * - `setInquiryStatus` flips between new / responded / archived
 * - `convertInquiryToOrder` creates a customer (or links to an existing one
 *   by email) and a draft order with no items, then redirects to the new
 *   order's detail page so the owner can add line items
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { customers, inquiries, orders } from "@/db/schema";
import { recordAudit } from "@/server/audit";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const StatusSchema = z.enum(["new", "responded", "archived"]);

export async function setInquiryStatus(input: {
  inquiryId: string;
  status: z.infer<typeof StatusSchema>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const actorId = await requireOwner();
  const parsed = z
    .object({ inquiryId: z.string().min(1), status: StatusSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const [current] = await db
    .select({ status: inquiries.status })
    .from(inquiries)
    .where(eq(inquiries.id, parsed.data.inquiryId))
    .limit(1);
  if (!current) return { ok: false, error: "Inquiry not found" };
  if (current.status === parsed.data.status) return { ok: true };

  await db
    .update(inquiries)
    .set({ status: parsed.data.status })
    .where(eq(inquiries.id, parsed.data.inquiryId));

  await recordAudit({
    actorId,
    entity: "inquiry",
    entityId: parsed.data.inquiryId,
    action: parsed.data.status === "archived" ? "archive" : "update",
    diff: { from: current.status, to: parsed.data.status },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.inquiryId}`);
  revalidatePath("/admin");
  return { ok: true };
}

const ConvertSchema = z.object({
  inquiryId: z.string().min(1),
  fulfillmentType: z.enum(["pickup", "delivery"]),
  requestedDate: z.string().min(1), // ISO yyyy-mm-dd
});

export async function convertInquiryToOrder(input: {
  inquiryId: string;
  fulfillmentType: "pickup" | "delivery";
  requestedDate: string;
}): Promise<never | { ok: false; error: string }> {
  const actorId = await requireOwner();
  const parsed = ConvertSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, parsed.data.inquiryId))
    .limit(1);
  if (!inquiry) return { ok: false, error: "Inquiry not found" };
  if (inquiry.convertedOrderId) {
    return { ok: false, error: "Inquiry already converted" };
  }

  const requestedDate = new Date(parsed.data.requestedDate);
  if (Number.isNaN(requestedDate.getTime())) {
    return { ok: false, error: "Invalid requested date" };
  }

  const newOrderId = await db.transaction(async (tx) => {
    // Find or create customer by email (case-insensitive).
    const normalizedEmail = inquiry.rawEmail.toLowerCase().trim();
    const existing = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, normalizedEmail))
      .limit(1);

    let customerId: string;
    if (existing[0]) {
      customerId = existing[0].id;
    } else {
      const [created] = await tx
        .insert(customers)
        .values({
          name: inquiry.rawName,
          email: normalizedEmail,
          phone: inquiry.rawPhone,
        })
        .returning({ id: customers.id });
      if (!created) throw new Error("Failed to create customer");
      customerId = created.id;
    }

    const [order] = await tx
      .insert(orders)
      .values({
        customerId,
        status: "new",
        fulfillmentType: parsed.data.fulfillmentType,
        requestedDate,
        subtotalCents: 0,
        totalCents: 0,
        source: "inquiry",
        notes: `Converted from inquiry: ${inquiry.message.slice(0, 200)}`,
      })
      .returning({ id: orders.id });
    if (!order) throw new Error("Failed to create order");

    await tx
      .update(inquiries)
      .set({ status: "responded", convertedOrderId: order.id })
      .where(eq(inquiries.id, inquiry.id));

    return order.id;
  });

  await recordAudit({
    actorId,
    entity: "inquiry",
    entityId: parsed.data.inquiryId,
    action: "convert",
    diff: { orderId: newOrderId },
  });
  await recordAudit({
    actorId,
    entity: "order",
    entityId: newOrderId,
    action: "create",
    diff: { source: "inquiry", inquiryId: parsed.data.inquiryId },
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders/${newOrderId}`);
  // Unreachable — `redirect()` throws — but satisfies TS' return analysis.
  // eslint-disable-next-line no-unreachable
  return { ok: false, error: "unreachable" };
}
