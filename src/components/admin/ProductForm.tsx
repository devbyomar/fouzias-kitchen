"use client";

/**
 * Shared product create/edit form.
 *
 * Accepts an optional `initial` product (edit mode) — when not provided, the
 * form submits to createProduct() and the server action redirects to the new
 * detail page. In edit mode it submits to updateProduct() and stays put.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, type ProductFormInput } from "@/server/actions/products";

type Initial = Partial<ProductFormInput> & { productId?: string };

const DEFAULTS: ProductFormInput = {
  slug: "",
  nameEn: "",
  nameTraditional: "",
  subtitle: "",
  description: "",
  priceCents: 0,
  unitLabel: "",
  photoUrl: "",
  leadTimeDays: 3,
  minQty: 1,
  sortOrder: 0,
  active: true,
  allowsInstantCheckout: true,
};

export function ProductForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.productId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const merged = { ...DEFAULTS, ...initial };
  const [form, setForm] = useState<ProductFormInput>({
    productId: initial?.productId,
    slug: merged.slug ?? "",
    nameEn: merged.nameEn ?? "",
    nameTraditional: merged.nameTraditional ?? "",
    subtitle: merged.subtitle ?? "",
    description: merged.description ?? "",
    priceCents: merged.priceCents ?? 0,
    unitLabel: merged.unitLabel ?? "",
    photoUrl: merged.photoUrl ?? "",
    leadTimeDays: merged.leadTimeDays ?? 3,
    minQty: merged.minQty ?? 1,
    sortOrder: merged.sortOrder ?? 0,
    active: merged.active ?? true,
    allowsInstantCheckout: merged.allowsInstantCheckout ?? true,
  });

  function update<K extends keyof ProductFormInput>(key: K, value: ProductFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form
      className="convert-form"
      action={() => {
        setError(null);
        startTransition(async () => {
          const action = isEdit ? updateProduct : createProduct;
          const res = await action(form);
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
        <label className="convert-form__field" style={{ flex: "2 1 280px" }}>
          Display name (English)
          <input
            value={form.nameEn}
            onChange={(e) => update("nameEn", e.target.value)}
            required
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 200px" }}>
          Slug
          <input
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="kulche-namaki"
            required
            disabled={pending}
          />
        </label>
      </div>

      <div className="convert-form__row">
        <label className="convert-form__field" style={{ flex: "1 1 240px" }}>
          Traditional name
          <input
            value={form.nameTraditional ?? ""}
            onChange={(e) => update("nameTraditional", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "2 1 320px" }}>
          Subtitle (one-line tagline)
          <input
            value={form.subtitle ?? ""}
            onChange={(e) => update("subtitle", e.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <label className="convert-form__field">
        Description
        <textarea
          className="note-form__input"
          rows={4}
          value={form.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          disabled={pending}
        />
      </label>

      <div className="convert-form__row">
        <label className="convert-form__field" style={{ flex: "1 1 140px" }}>
          Price (CAD)
          <input
            type="number"
            step="0.01"
            min="0"
            value={(form.priceCents / 100).toFixed(2)}
            onChange={(e) => update("priceCents", Math.round(Number(e.target.value || 0) * 100))}
            required
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 160px" }}>
          Unit label
          <input
            value={form.unitLabel ?? ""}
            placeholder="per dozen"
            onChange={(e) => update("unitLabel", e.target.value)}
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 120px" }}>
          Min qty
          <input
            type="number"
            min="1"
            value={form.minQty}
            onChange={(e) => update("minQty", Number(e.target.value || 1))}
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 120px" }}>
          Lead time (days)
          <input
            type="number"
            min="0"
            value={form.leadTimeDays}
            onChange={(e) => update("leadTimeDays", Number(e.target.value || 0))}
            disabled={pending}
          />
        </label>
        <label className="convert-form__field" style={{ flex: "1 1 100px" }}>
          Sort order
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => update("sortOrder", Number(e.target.value || 0))}
            disabled={pending}
          />
        </label>
      </div>

      <label className="convert-form__field">
        Photo URL
        <input
          value={form.photoUrl ?? ""}
          onChange={(e) => update("photoUrl", e.target.value)}
          placeholder="https://…"
          disabled={pending}
        />
      </label>

      <div className="convert-form__row">
        <label className="convert-form__check">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => update("active", e.target.checked)}
            disabled={pending}
          />{" "}
          Active (visible on storefront)
        </label>
        <label className="convert-form__check">
          <input
            type="checkbox"
            checked={form.allowsInstantCheckout}
            onChange={(e) => update("allowsInstantCheckout", e.target.checked)}
            disabled={pending}
          />{" "}
          Allows instant checkout
        </label>
      </div>

      <div className="note-form__row">
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save product" : "Create product"}
        </button>
        {error && <span className="note-form__error">{error}</span>}
        {!error && savedAt && (
          <span className="convert-form__hint">Saved {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
    </form>
  );
}
