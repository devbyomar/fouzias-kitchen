"use client";

/**
 * Payment actions panel for the order detail page.
 *
 * Two flows:
 *  - "Send checkout link" creates a Stripe Checkout session and copies the
 *    URL to the clipboard so the owner can paste it into a text/email.
 *  - "Refund" issues a partial or full refund against the captured PI.
 *
 * Refunds always confirm the dollar amount before submitting.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCheckoutSessionForOrder,
  refundOrder,
} from "@/server/actions/payments";

type Props = {
  orderId: string;
  paymentStatus: string;
  totalCents: number;
  amountPaidCents: number;
  refundedCents: number;
  hasPaymentIntent: boolean;
};

function formatCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export function PaymentActions({
  orderId,
  paymentStatus,
  totalCents,
  amountPaidCents,
  refundedCents,
  hasPaymentIntent,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [refundDollars, setRefundDollars] = useState("");

  const refundable = amountPaidCents - refundedCents;
  const dueCents = Math.max(0, totalCents - amountPaidCents);
  const canCharge = paymentStatus !== "paid" && paymentStatus !== "refunded" && dueCents > 0;
  const canRefund = hasPaymentIntent && refundable > 0;

  function handleCheckout() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await createCheckoutSessionForOrder(orderId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      try {
        await navigator.clipboard.writeText(res.url);
        setInfo("Checkout link copied to clipboard.");
      } catch {
        setInfo(`Checkout link: ${res.url}`);
      }
      router.refresh();
    });
  }

  function handleRefund() {
    setError(null);
    setInfo(null);
    const dollars = Number(refundDollars);
    let amountCents: number | undefined;
    if (refundDollars.trim()) {
      if (!Number.isFinite(dollars) || dollars <= 0) {
        setError("Refund amount must be a positive number");
        return;
      }
      amountCents = Math.round(dollars * 100);
      if (amountCents > refundable) {
        setError(`Cannot refund more than ${formatCents(refundable)}`);
        return;
      }
    }
    const display = amountCents != null ? formatCents(amountCents) : formatCents(refundable);
    if (!confirm(`Refund ${display} via Stripe? This cannot be undone.`)) return;

    startTransition(async () => {
      const res = await refundOrder({ orderId, amountCents });
      if (!res.ok) {
        setError(res.error);
      } else {
        setInfo(`Refunded ${display}.`);
        setRefundDollars("");
        router.refresh();
      }
    });
  }

  return (
    <div className="payment-actions">
      <dl className="kv">
        <div>
          <dt>Total</dt>
          <dd>{formatCents(totalCents)}</dd>
        </div>
        <div>
          <dt>Paid</dt>
          <dd>{formatCents(amountPaidCents)}</dd>
        </div>
        <div>
          <dt>Refunded</dt>
          <dd>{refundedCents > 0 ? `−${formatCents(refundedCents)}` : "—"}</dd>
        </div>
        <div>
          <dt>Balance due</dt>
          <dd>
            <strong>{formatCents(dueCents)}</strong>
          </dd>
        </div>
      </dl>

      <div className="status-actions" style={{ marginTop: ".75rem" }}>
        <button
          type="button"
          className="btn btn--primary"
          disabled={pending || !canCharge}
          onClick={handleCheckout}
        >
          {pending ? "Working…" : "Send Stripe checkout link"}
        </button>
      </div>

      {canRefund && (
        <div className="payment-actions__refund">
          <h3 className="panel__subhead">Issue refund</h3>
          <div className="convert-form__row">
            <label className="convert-form__field" style={{ flex: "1 1 160px" }}>
              Amount (CAD) — leave blank for full
              <input
                type="number"
                step="0.01"
                min="0"
                max={(refundable / 100).toFixed(2)}
                value={refundDollars}
                onChange={(e) => setRefundDollars(e.target.value)}
                placeholder={`up to ${formatCents(refundable)}`}
                disabled={pending}
              />
            </label>
            <button
              type="button"
              className="btn btn--danger"
              disabled={pending}
              onClick={handleRefund}
            >
              {pending ? "Refunding…" : "Refund"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="status-actions__error" style={{ marginTop: ".5rem" }}>{error}</p>}
      {info && (
        <p className="convert-form__hint" style={{ marginTop: ".5rem" }}>
          {info}
        </p>
      )}
    </div>
  );
}
