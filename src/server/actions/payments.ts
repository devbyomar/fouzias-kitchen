"use server";

/**
 * Payment-related server actions, all gated to authenticated owner staff.
 *
 * - createCheckoutSessionForOrder: produces a Stripe Checkout link the owner
 *   can copy/send to a customer for an existing order (typical when an
 *   inquiry is converted to a draft order and we need to collect payment
 *   out-of-band).
 * - refundOrder: full or partial refund against the captured PaymentIntent.
 *   Always issued through Stripe so cards stay reconciled; on success we
 *   update orders.refundedCents + paymentStatus and emit a status event +
 *   audit row.
 *
 * Webhooks (in /api/webhooks/stripe) are the source of truth for amounts —
 * these actions optimistically apply state and let the webhook reconcile.
 */

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { customers, orders, statusEvents } from "@/db/schema";
import { getStripe, STRIPE_CURRENCY } from "@/lib/stripe";
import { recordAudit } from "@/server/audit";
import { env } from "@/lib/env";

export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? Record<string, never> : T))
  | { ok: false; error: string };

function appBaseUrl(): string {
  // Prefer the explicitly configured SITE_URL; fall back to Vercel's preview
  // hostname so newly-spun-up preview deploys produce reachable Stripe
  // success/cancel URLs without manual configuration.
  if (env.SITE_URL && !env.SITE_URL.startsWith("http://localhost")) return env.SITE_URL;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return env.SITE_URL || "http://localhost:3000";
}

/**
 * Create a hosted Stripe Checkout session for an existing order. Returns a
 * URL the owner can hand to the customer. We embed orderId as
 * client_reference_id and metadata so the webhook can look it up.
 */
export async function createCheckoutSessionForOrder(
  orderId: string,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === "cancelled") return { ok: false, error: "Order is cancelled" };
  if (order.paymentStatus === "paid") return { ok: false, error: "Order is already paid" };

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .limit(1);

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  const base = appBaseUrl();
  let checkoutSession: Stripe.Checkout.Session;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      // We pass a single line item for the full remaining balance so refunds
      // work cleanly. Item-level breakdown lives in our DB; Stripe just sees
      // the total.
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: order.totalCents - order.amountPaidCents,
            product_data: {
              name: `Fouzia's Kitchen — Order #${order.number}`,
              description: `${order.fulfillmentType} for ${order.requestedDate.toISOString().slice(0, 10)}`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customer?.email ?? undefined,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        orderNumber: String(order.number),
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          orderNumber: String(order.number),
        },
        // Capture immediately. We don't need auth-then-capture flows for
        // bakery orders; everything is fulfilled within days.
      },
      success_url: `${base}/admin/orders/${order.id}?paid=1`,
      cancel_url: `${base}/admin/orders/${order.id}?cancelled=1`,
    });
  } catch (err) {
    return { ok: false, error: `Stripe error: ${(err as Error).message}` };
  }

  if (!checkoutSession.url) {
    return { ok: false, error: "Stripe did not return a checkout URL" };
  }

  // Persist the session id so the webhook can match the event back even if
  // metadata gets stripped by future API changes.
  await db
    .update(orders)
    .set({
      stripeSessionId: checkoutSession.id,
      paymentStatus: order.paymentStatus === "unpaid" ? "pending" : order.paymentStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  await recordAudit({
    actorId: session.user.id,
    entity: "order",
    entityId: order.id,
    action: "payment_update",
    diff: { after: { stripeSessionId: checkoutSession.id, status: "checkout_link_created" } },
  });

  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true, url: checkoutSession.url };
}

/**
 * Issue a refund. If `amountCents` is omitted, refund the full remaining
 * balance (paid - already-refunded). Webhook reconciliation will adjust if
 * Stripe ends up returning a different amount (e.g. dispute).
 */
export async function refundOrder(input: {
  orderId: string;
  amountCents?: number;
  reason?: "requested_by_customer" | "duplicate" | "fraudulent";
  note?: string;
}): Promise<ActionResult<{ refundedCents: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!order) return { ok: false, error: "Order not found" };
  if (!order.stripePaymentIntentId) {
    return { ok: false, error: "Order has no Stripe payment to refund" };
  }
  const refundable = order.amountPaidCents - order.refundedCents;
  if (refundable <= 0) return { ok: false, error: "Nothing left to refund" };

  const amount = Math.min(input.amountCents ?? refundable, refundable);
  if (amount <= 0) return { ok: false, error: "Refund amount must be positive" };

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount,
      reason: input.reason,
      metadata: { orderId: order.id, orderNumber: String(order.number) },
    });
  } catch (err) {
    return { ok: false, error: `Stripe refund failed: ${(err as Error).message}` };
  }

  // Optimistic local update. The webhook will reconcile authoritatively.
  const newRefunded = order.refundedCents + amount;
  const fullyRefunded = newRefunded >= order.amountPaidCents;
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        refundedCents: newRefunded,
        paymentStatus: fullyRefunded ? "refunded" : order.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    await tx.insert(statusEvents).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: order.status,
      actorId: session.user!.id!,
      note: `Refund issued: $${(amount / 100).toFixed(2)}${input.note ? ` — ${input.note}` : ""} (Stripe id ${refund.id})`,
    });
  });

  await recordAudit({
    actorId: session.user.id,
    entity: "order",
    entityId: order.id,
    action: "refund",
    diff: { after: { amount, stripeRefundId: refund.id, totalRefunded: newRefunded } },
  });

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
  return { ok: true, refundedCents: newRefunded };
}
