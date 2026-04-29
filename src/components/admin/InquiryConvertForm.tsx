"use client";

/**
 * Convert-inquiry-to-order form. Calls the server action which creates
 * the customer + draft order in a transaction and redirects to the new
 * order detail page.
 */

import { useState, useTransition } from "react";
import { convertInquiryToOrder } from "@/server/actions/inquiries";

export function InquiryConvertForm({ inquiryId }: { inquiryId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const today = new Date();
  today.setDate(today.getDate() + 3);
  const [date, setDate] = useState(today.toISOString().slice(0, 10));

  return (
    <form
      className="convert-form"
      action={() => {
        setError(null);
        startTransition(async () => {
          const res = await convertInquiryToOrder({
            inquiryId,
            fulfillmentType: fulfillment,
            requestedDate: date,
          });
          if (res && !res.ok) setError(res.error);
        });
      }}
    >
      <div className="convert-form__row">
        <label className="convert-form__field">
          <span>Fulfillment</span>
          <select
            value={fulfillment}
            onChange={(e) => setFulfillment(e.target.value as "pickup" | "delivery")}
            disabled={pending}
          >
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>
        <label className="convert-form__field">
          <span>Requested date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={pending}
            min={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <button type="submit" disabled={pending} className="btn btn--primary">
          {pending ? "Creating order…" : "Create draft order →"}
        </button>
      </div>
      {error && <p className="convert-form__error">{error}</p>}
      <p className="convert-form__hint">
        Creates an empty order. You&rsquo;ll be redirected to add items, set price, and confirm.
      </p>
    </form>
  );
}
