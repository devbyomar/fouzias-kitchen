# Payments — Stripe Testing Guide

End-to-end testing of the Stripe Checkout + webhook + refund flow.

## 1. Required environment variables

Set these in `.env.local` (and in Vercel for Preview/Production):

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # printed by `stripe listen`
STRIPE_TAX_ENABLED=false             # optional; reserved for future
SITE_URL=http://localhost:3000       # used to build success/cancel URLs
```

> All three Stripe keys are `.optional()` in `src/lib/env.ts` so the app
> still builds without them — payment buttons will just surface a clear
> "STRIPE_SECRET_KEY is not configured" error when clicked.

## 2. Run the Stripe CLI listener

In a second terminal:

```bash
npm run dev:stripe
```

That runs `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
The first line of output looks like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx
```

Copy that into `STRIPE_WEBHOOK_SECRET` in `.env.local` and restart `next dev`.

## 3. Happy path

1. Open an unpaid order in the admin: `/admin/orders/<id>`.
2. Click **Send Stripe checkout link** in the Payment panel. The owner's
   clipboard now contains a hosted Checkout URL; the order's
   `paymentStatus` flips to `pending` and `stripeSessionId` is persisted.
3. Open the URL in an incognito window and pay with `4242 4242 4242 4242`,
   any future expiry, any CVC, any postal code.
4. Stripe fires `checkout.session.completed` → our webhook captures the
   PaymentIntent id and sets `paymentStatus = paid`. A few seconds later
   `payment_intent.succeeded` arrives and reconciles `amountPaidCents`,
   `cardBrand`, and `cardLast4`.
5. Reload the order page — the Payment pill is green, the Payment panel
   shows the card brand/last4 and the amount paid, and a status-event
   note records the capture.

## 4. Refund flow

1. From the same order, scroll to **Payment → Issue refund**.
2. Leave the amount blank for a full refund, or enter dollars (e.g. `5.00`).
3. Confirm the prompt. We call `stripe.refunds.create({ payment_intent })`,
   optimistically update `refundedCents` + `paymentStatus`, then the
   `charge.refunded` webhook reconciles authoritatively.
4. The Payment pill flips to `refunded` once `refundedCents >= amountPaidCents`.

## 5. Failure path

To test a declined card, use `4000 0000 0000 0002`. Stripe sends
`payment_intent.payment_failed` and we set `paymentStatus = failed` and
log a status event with the decline reason.

## 6. Idempotency

The `webhook_event` table has a unique index on `(provider, event_id)`.
If Stripe replays the same event (e.g. via `stripe events resend <id>`),
the second insert fails and the route short-circuits with
`{ received: true, duplicate: true }` — no double-charging or
double-refunding the local row.

## 7. Production checklist

- [ ] Replace test keys with live keys in Vercel (Production scope only).
- [ ] Add the live webhook endpoint in the Stripe Dashboard pointing at
      `https://<domain>/api/webhooks/stripe` and copy the live signing
      secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] Subscribe the endpoint to: `checkout.session.completed`,
      `payment_intent.succeeded`, `payment_intent.payment_failed`,
      `charge.refunded`.
- [ ] Remove `SKIP_ENV_VALIDATION=1` from the Production env scope so
      missing keys fail loudly.
