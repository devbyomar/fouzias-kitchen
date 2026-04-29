/**
 * Product detail / edit — server component.
 *
 * Two panels: the editable product form (shared with /new) and a per-date
 * inventory editor for the next two weeks. Archive/restore lives in the
 * header so it's always one click away.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/server/queries/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductArchiveButton } from "@/components/admin/ProductArchiveButton";
import { InventoryEditor } from "@/components/admin/InventoryEditor";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProductById(id);
  return { title: `${data?.product.nameEn ?? "Product"} · Owner Console` };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProductById(id);
  if (!data) notFound();
  const { product, inventory } = data;

  return (
    <div className="dashboard">
      <Link href="/admin/products" className="back-link">← All products</Link>

      <header className="order-detail__head">
        <div>
          <p className="dashboard__eyebrow">Product</p>
          <h1 className="dashboard__title">
            {product.nameEn}{" "}
            <span className={`pill pill--${product.active ? "fulfilled" : "cancelled"}`}>
              {product.active ? "active" : "archived"}
            </span>
          </h1>
          <p className="order-detail__sub">
            {formatCents(product.priceCents)}
            {product.unitLabel && <> · {product.unitLabel}</>} · slug <code>{product.slug}</code>
          </p>
        </div>
        <ProductArchiveButton productId={product.id} active={product.active} />
      </header>

      <section className="panel">
        <h2 className="panel__title">Details</h2>
        <ProductForm
          initial={{
            productId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameTraditional: product.nameTraditional ?? "",
            subtitle: product.subtitle ?? "",
            description: product.description ?? "",
            priceCents: product.priceCents,
            unitLabel: product.unitLabel ?? "",
            photoUrl: product.photoUrl ?? "",
            leadTimeDays: product.leadTimeDays,
            minQty: product.minQty,
            sortOrder: product.sortOrder,
            active: product.active,
            allowsInstantCheckout: product.allowsInstantCheckout,
          }}
        />
      </section>

      <section className="panel panel--flush">
        <h2 className="panel__title" style={{ padding: "1rem 1rem 0" }}>
          Inventory — next 14 days
        </h2>
        <p className="panel__subhead" style={{ padding: "0 1rem" }}>
          Set what's actually available each day. Days you haven't touched default to zero.
        </p>
        <div style={{ padding: "0 1rem 1rem" }}>
          <InventoryEditor productId={product.id} initial={inventory} daysAhead={14} />
        </div>
      </section>
    </div>
  );
}
