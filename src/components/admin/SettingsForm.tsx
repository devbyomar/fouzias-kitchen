"use client";

/**
 * Settings editor. One form, many keys — saved as a single transaction.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/server/actions/settings";
import type { SettingsShape } from "@/server/queries/settings";

export function SettingsForm({ initial }: { initial: SettingsShape }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<SettingsShape>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function up<K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form
      className="convert-form"
      action={() => {
        setError(null);
        startTransition(async () => {
          const res = await saveSettings(form);
          if (!res.ok) setError(res.error);
          else {
            setSavedAt(new Date());
            router.refresh();
          }
        });
      }}
    >
      <h3 className="panel__subhead">Storefront identity</h3>
      <div className="convert-form__row">
        <label className="convert-form__field" style={{ flex: "2 1 280px" }}>
          Store name
          <input value={form.storeName} onChange={(e) => up("storeName", e.target.value)} disabled={pending} />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 240px" }}>
          Contact email
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => up("contactEmail", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 180px" }}>
          Contact phone
          <input
            value={form.contactPhone}
            onChange={(e) => up("contactPhone", e.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <label className="convert-form__field">
        Pickup address (shown on order confirmations)
        <input
          value={form.pickupAddress}
          onChange={(e) => up("pickupAddress", e.target.value)}
          disabled={pending}
        />
      </label>

      <h3 className="panel__subhead">Pricing & fulfillment</h3>
      <div className="convert-form__row">
        <label className="convert-form__field" style={{ flex: "1 1 160px" }}>
          Delivery fee (CAD)
          <input
            type="number"
            step="0.01"
            min="0"
            value={(form.deliveryFeeCents / 100).toFixed(2)}
            onChange={(e) => up("deliveryFeeCents", Math.round(Number(e.target.value || 0) * 100))}
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 200px" }}>
          Free-delivery threshold (CAD)
          <input
            type="number"
            step="0.01"
            min="0"
            value={(form.freeDeliveryThresholdCents / 100).toFixed(2)}
            onChange={(e) =>
              up("freeDeliveryThresholdCents", Math.round(Number(e.target.value || 0) * 100))
            }
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 160px" }}>
          Tax rate (basis points)
          <input
            type="number"
            min="0"
            max="5000"
            value={form.taxRateBps}
            onChange={(e) => up("taxRateBps", Number(e.target.value || 0))}
            disabled={pending}
          />
          <span className="convert-form__hint">{(form.taxRateBps / 100).toFixed(2)}%</span>
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 160px" }}>
          Default lead time (days)
          <input
            type="number"
            min="0"
            value={form.defaultLeadTimeDays}
            onChange={(e) => up("defaultLeadTimeDays", Number(e.target.value || 0))}
            disabled={pending}
          />
        </label>
      </div>

      <h3 className="panel__subhead">Storefront copy</h3>
      <label className="convert-form__field">
        Hours / availability note
        <input value={form.hoursNote} onChange={(e) => up("hoursNote", e.target.value)} disabled={pending} />
      </label>
      <label className="convert-form__field">
        Booking note
        <input
          value={form.bookingNote}
          onChange={(e) => up("bookingNote", e.target.value)}
          disabled={pending}
        />
      </label>

      <div className="note-form__row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        {error && <span className="note-form__error">{error}</span>}
        {!error && savedAt && (
          <span className="convert-form__hint">Saved {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
    </form>
  );
}
