"use client";

/**
 * Per-day capacity form for the calendar side panel. Owner can cap orders
 * for a date or block it entirely (e.g. closed for holiday).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDayCapacity } from "@/server/actions/capacity";

export function DayCapacityForm({
  date,
  initial,
}: {
  date: string;
  initial: { maxOrders: number; blocked: boolean; blockReason: string | null } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [maxOrders, setMaxOrders] = useState(initial?.maxOrders ?? 99);
  const [blocked, setBlocked] = useState(initial?.blocked ?? false);
  const [reason, setReason] = useState(initial?.blockReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  return (
    <form
      className="convert-form"
      action={() => {
        setError(null);
        startTransition(async () => {
          const res = await setDayCapacity({
            date,
            maxOrders,
            blocked,
            blockReason: reason || undefined,
          });
          if (!res.ok) setError(res.error);
          else {
            setSavedAt(new Date());
            router.refresh();
          }
        });
      }}
    >
      <div className="convert-form__row">
        <label className="convert-form__field" style={{ flex: "1 1 140px" }}>
          Max orders
          <input
            type="number"
            min={0}
            value={maxOrders}
            onChange={(e) => setMaxOrders(Number(e.target.value || 0))}
            disabled={pending}
          />
        </label>
        <label className="convert-form__check">
          <input
            type="checkbox"
            checked={blocked}
            onChange={(e) => setBlocked(e.target.checked)}
            disabled={pending}
          />{" "}
          Block this day
        </label>
      </div>
      {blocked && (
        <label className="convert-form__field">
          Reason (shown to staff only)
          <input value={reason} onChange={(e) => setReason(e.target.value)} disabled={pending} />
        </label>
      )}
      <div className="note-form__row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save day"}
        </button>
        {error && <span className="note-form__error">{error}</span>}
        {!error && savedAt && (
          <span className="convert-form__hint">Saved {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
    </form>
  );
}
