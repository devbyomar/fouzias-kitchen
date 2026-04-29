"use client";

/**
 * Edit form for the customer's contact + notes + tags.
 *
 * Tags are entered as a comma-separated list in the textbox and split on
 * submit so the owner doesn't have to deal with chip widgets.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer } from "@/server/actions/customers";

type Props = {
  customerId: string;
  initial: {
    name: string;
    email: string | null;
    phone: string | null;
    tags: string[];
    notes: string | null;
  };
};

export function CustomerEditForm({ customerId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  return (
    <form
      className="convert-form"
      action={() => {
        setError(null);
        startTransition(async () => {
          const res = await updateCustomer({
            customerId,
            name,
            email: email || undefined,
            phone: phone || undefined,
            tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
            notes: notes || undefined,
          });
          if (!res.ok) {
            setError(res.error);
          } else {
            setSavedAt(new Date());
            router.refresh();
          }
        });
      }}
    >
      <div className="convert-form__row">
        <label className="convert-form__field" style={{ flex: "1 1 220px" }}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required disabled={pending} />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 220px" }}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 160px" }}>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={pending} />
        </label>
      </div>
      <label className="convert-form__field">
        Tags <span className="convert-form__hint">(comma separated, e.g. wholesale, vip)</span>
        <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} disabled={pending} />
      </label>
      <label className="convert-form__field">
        Internal notes
        <textarea
          className="note-form__input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={pending}
        />
      </label>
      <div className="note-form__row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save customer"}
        </button>
        {error && <span className="note-form__error">{error}</span>}
        {!error && savedAt && (
          <span className="convert-form__hint">Saved {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
    </form>
  );
}
