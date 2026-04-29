"use client";

/**
 * Archive / restore toggle for a product. Soft delete only.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProduct, restoreProduct } from "@/server/actions/products";

export function ProductArchiveButton({
  productId,
  active,
}: {
  productId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="status-actions">
      <button
        type="button"
        className={active ? "btn btn--danger" : "btn btn--ghost"}
        disabled={pending}
        onClick={() => {
          if (active && !confirm("Archive this product? It will be hidden from the storefront.")) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const res = active ? await archiveProduct(productId) : await restoreProduct(productId);
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Working…" : active ? "Archive" : "Restore"}
      </button>
      {error && <span className="status-actions__error">{error}</span>}
    </span>
  );
}
