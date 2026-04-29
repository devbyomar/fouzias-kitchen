"use client";

/**
 * Add-note form. Server action handles persistence + revalidation.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addOrderNote } from "@/server/actions/orders";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="note-form"
      action={() => {
        if (!note.trim()) return;
        setError(null);
        startTransition(async () => {
          const res = await addOrderNote({ orderId, note: note.trim() });
          if (!res.ok) {
            setError(res.error);
          } else {
            setNote("");
            router.refresh();
          }
        });
      }}
    >
      <textarea
        className="note-form__input"
        placeholder="Add a note (visible to staff only)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={2000}
        disabled={pending}
      />
      <div className="note-form__row">
        <button
          type="submit"
          disabled={pending || !note.trim()}
          className="btn btn--primary"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
        {error && <span className="note-form__error">{error}</span>}
      </div>
    </form>
  );
}
