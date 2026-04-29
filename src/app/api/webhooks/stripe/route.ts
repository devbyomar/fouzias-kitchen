/**
 * Stripe webhook handler — single source of truth for payment state.
 *
 * Vercel + Next 15 caveats:
 *  - Must run on the Node runtime so we can read the raw body for signature
 *    verification (Web Crypto's Edge runtime won't expose `Buffer`).
 *  - We disable Next's body parsing by reading the raw text ourselves via
 *    `request.text()` — Next's App Router gives us the raw body that way.
 *  - Idempotency: `webhookEvents` has a unique index on (provider, eventId).
 *    If the same event arrives twice (Stripe retries on non-2xx), the second
 *    insert will fail and we short-circuit.
 *
 * Events handled:
 *  - checkout.session.completed → mark payment captured + persist PI id
 *  - payment_intent.succeeded   → reconcile amountPaid + card brand/last4
 *  - charge.refunded            → reconcile refundedCents + paymentStatus
 *  - payment_intent.payment_failed → flip paymentStatus to "failed"
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, statusEvents, webhookEvents } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  // Idempotent receipt log. If we've seen this event id before, ack 200 so
  // Stripe stops retrying — but don't re-process.
  try {
    await db.insert(webhookEvents).values({
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  } catch {
    // Unique constraint violation on (provider, eventId) — already processed.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // Unhandled event types are still considered processed for our
        // bookkeeping — we recorded them in webhookEvents above.
        break;
    }

    await db
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.eventId, event.id));
  } catch (err) {
    // Mark failure but still 200 so Stripe doesn't pile up retries forever.
    // We rely on the audit log + manual replay for failures.
    await db
      .update(webhookEvents)
      .set({ processedAt: new Date(), error: (err as Error).message.slice(0, 1000) })
      .where(eq(webhookEvents.eventId, event.id));
    return NextResponse.json({ received: true, processed: false, error: (err as Error).message });
  }

  return NextResponse.json({ received: true });
}

async function findOrderForSession(sessionId: string, metadataOrderId?: string | null) {
  if (metadataOrderId) {
    const [byMeta] = await db.select().from(orders).where(eq(orders.id, metadataOrderId)).limit(1);
    if (byMeta) return byMeta;
  }
  const [bySession] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, sessionId))
    .limit(1);
  return bySession ?? null;
}

async function handleCheckoutCompleted(s: Stripe.Checkout.Session) {
  const orderId =
    (s.metadata?.orderId as string | undefined) ??
    (s.client_reference_id as string | undefined) ??
    null;
  const order = await findOrderForSession(s.id, orderId);
  if (!order) return;

  const paymentIntentId =
    typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
  const amountPaid = s.amount_total ?? 0;

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        stripePaymentIntentId: paymentIntentId,
        // Don't downgrade if a later event already set a better state.
        paymentStatus: sql`case when ${orders.paymentStatus} in ('paid','refunded') then ${orders.paymentStatus} else 'paid' end`,
        amountPaidCents: sql`greatest(${orders.amountPaidCents}, ${amountPaid})`,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    await tx.insert(statusEvents).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: order.status,
      note: `Payment captured via Stripe Checkout (session ${s.id})`,
    });
  });
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const orderId = (pi.metadata?.orderId as string | undefined) ?? null;
  if (!orderId && !pi.id) return;

  const [order] = orderId
    ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    : await db.select().from(orders).where(eq(orders.stripePaymentIntentId, pi.id)).limit(1);
  if (!order) return;

  // Pull card details off the latest charge.
  const charge =
    typeof pi.latest_charge === "string"
      ? await getStripe().charges.retrieve(pi.latest_charge)
      : (pi.latest_charge as Stripe.Charge | null);

  const card = charge?.payment_method_details?.card ?? null;

  await db
    .update(orders)
    .set({
      stripePaymentIntentId: pi.id,
      paymentStatus: sql`case when ${orders.paymentStatus} = 'refunded' then 'refunded' else 'paid' end`,
      amountPaidCents: sql`greatest(${orders.amountPaidCents}, ${pi.amount_received ?? pi.amount ?? 0})`,
      cardBrand: card?.brand ?? order.cardBrand,
      cardLast4: card?.last4 ?? order.cardLast4,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const orderId = (pi.metadata?.orderId as string | undefined) ?? null;
  const [order] = orderId
    ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    : await db.select().from(orders).where(eq(orders.stripePaymentIntentId, pi.id)).limit(1);
  if (!order) return;

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    await tx.insert(statusEvents).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: order.status,
      note: `Stripe payment failed: ${pi.last_payment_error?.message ?? "unknown reason"}`,
    });
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, piId))
    .limit(1);
  if (!order) return;

  const totalRefunded = charge.amount_refunded ?? 0;
  const fullyRefunded = totalRefunded >= (charge.amount ?? order.amountPaidCents);

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        refundedCents: totalRefunded,
        paymentStatus: fullyRefunded ? "refunded" : order.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    await tx.insert(statusEvents).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: order.status,
      note: `Refund reconciled from Stripe (total refunded $${(totalRefunded / 100).toFixed(2)})`,
    });
  });
}
