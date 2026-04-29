"use client";

/**
 * Quick status switcher for an inquiry — small button cluster wired to the
 * `setInquiryStatus` server action.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInquiryStatus } from "@/server/actions/inquiries";

type Status = "new" | "responded" | "archived";

const LABELS: Record<Status, string> = {
  new: "Mark new",
  responded: "Mark responded",
  archived: "Archive",
};

export function InquiryStatusButtons({
  inquiryId,
  current,
}: {
  inquiryId: string;
  current: Status;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Status | null>(null);

  const targets: Status[] = (["responded", "archived", "new"] as const).filter(
    (s) => s !== current,
  );

  return (
    <div className="status-actions">
      {targets.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending}
          className={`btn ${s === "archived" ? "btn--ghost" : "btn--primary"}`}
          onClick={() => {
            setActive(s);
            setError(null);
            startTransition(async () => {
              const res = await setInquiryStatus({ inquiryId, status: s });
              if (!res.ok) setError(res.error);
              else router.refresh();
              setActive(null);
            });
          }}
        >
          {pending && active === s ? "Saving…" : LABELS[s]}
        </button>
      ))}
      {error && <span className="status-actions__error">{error}</span>}
    </div>
  );
}
