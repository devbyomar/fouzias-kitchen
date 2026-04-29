"use client";

/**
 * Per-date inventory editor for a single product.
 *
 * Shows N day rows starting today; the owner sets quantity + sold-out flag
 * inline. Already-stocked dates pre-fill from the server-rendered initial.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInventory } from "@/server/actions/products";

type Row = { date: string; quantityAvailable: number; soldOut: boolean };

export function InventoryEditor({
  productId,
  initial,
  daysAhead = 14,
}: {
  productId: string;
  initial: Array<{ date: Date; quantityAvailable: number; soldOut: boolean }>;
  daysAhead?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyDate, setBusyDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialMap = new Map(
    initial.map((r) => [
      r.date.toISOString().slice(0, 10),
      { quantityAvailable: r.quantityAvailable, soldOut: r.soldOut },
    ]),
  );

  // Build the date strip in the visitor's local calendar.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows: Row[] = Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const existing = initialMap.get(iso);
    return {
      date: iso,
      quantityAvailable: existing?.quantityAvailable ?? 0,
      soldOut: existing?.soldOut ?? false,
    };
  });

  const [draft, setDraft] = useState<Record<string, Row>>(
    Object.fromEntries(rows.map((r) => [r.date, r])),
  );

  function save(date: string) {
    const row = draft[date];
    if (!row) return;
    setBusyDate(date);
    setError(null);
    startTransition(async () => {
      const res = await setInventory({
        productId,
        date,
        quantityAvailable: row.quantityAvailable,
        soldOut: row.soldOut,
      });
      setBusyDate(null);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="inventory-editor">
      <table className="data-table inventory-editor__table">
        <thead>
          <tr>
            <th>Date</th>
            <th style={{ width: 110 }}>Available</th>
            <th style={{ width: 100 }}>Sold out</th>
            <th style={{ width: 110 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const row = draft[r.date]!;
            const d = new Date(`${r.date}T00:00:00`);
            const label = d.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return (
              <tr key={r.date}>
                <td>{label}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    className="filters__input inventory-editor__qty"
                    value={row.quantityAvailable}
                    onChange={(e) =>
                      setDraft((m) => ({
                        ...m,
                        [r.date]: { ...row, quantityAvailable: Number(e.target.value || 0) },
                      }))
                    }
                    disabled={pending && busyDate === r.date}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={row.soldOut}
                    onChange={(e) =>
                      setDraft((m) => ({
                        ...m,
                        [r.date]: { ...row, soldOut: e.target.checked },
                      }))
                    }
                    disabled={pending && busyDate === r.date}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => save(r.date)}
                    disabled={pending && busyDate === r.date}
                  >
                    {pending && busyDate === r.date ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <p className="status-actions__error">{error}</p>}
    </div>
  );
}
