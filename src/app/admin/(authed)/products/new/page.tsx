/**
 * New product — server component shell that renders the shared form in
 * create mode. The form's server action redirects to /admin/products/[id]
 * on success.
 */

import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product · Owner Console" };

export default function NewProductPage() {
  return (
    <div className="dashboard">
      <Link href="/admin/products" className="back-link">← All products</Link>
      <header className="order-detail__head">
        <div>
          <p className="dashboard__eyebrow">Catalog</p>
          <h1 className="dashboard__title">New product</h1>
        </div>
      </header>
      <section className="panel">
        <ProductForm />
      </section>
    </div>
  );
}
