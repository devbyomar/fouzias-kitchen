"use client";

/**
 * Status transition control for an order. Renders one button per allowed
 * next status; on click, calls the server action with optimistic UI via
 * `useTransition` and surfaces errors inline.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeOrderStatus } from "@/server/actions/orders";

type Status = "new" | "confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled";

const LABELS: Record<Status, string> = {
  new: "New",
  confirmed: "Confirm",
  in_prep: "Start prep",
  ready: "Mark ready",
  fulfilled: "Mark fulfilled",
  cancelled: "Cancel",
};

export function OrderStatusActions({
  orderId,
  allowed,
}: {
  orderId: string;
  allowed: Array<"confirmed" | "in_prep" | "ready" | "fulfilled" | "cancelled">;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<Status | null>(null);

  if (allowed.length === 0) {
    return <p className="status-actions__terminal">No further actions — order is in a terminal state.</p>;
  }

  return (
    <div className="status-actions">
      {allowed.map((next) => {
        const isCancel = next === "cancelled";
        return (
          <button
            key={next}
            type="button"
            disabled={pending}
            className={`btn ${isCancel ? "btn--danger" : "btn--primary"}`}
            onClick={() => {
              if (isCancel && !confirm("Cancel this order? This cannot be undone.")) return;
              setError(null);
              setActiveTarget(next);
              startTransition(async () => {
                const result = await changeOrderStatus({ orderId, toStatus: next });
                if (!result.ok) setError(result.error);
                else router.refresh();
                setActiveTarget(null);
              });
            }}
          >
            {pending && activeTarget === next ? "Saving…" : LABELS[next]}
          </button>
        );
      })}
      {error && <span className="status-actions__error">{error}</span>}
    </div>
  );
}
