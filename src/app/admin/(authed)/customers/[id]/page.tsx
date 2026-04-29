/**
 * Customer detail — server component.
 *
 * Shows lifetime stats, an editable contact card, and full order + inquiry
 * history. Inquiry matching is by lowercased email so the same person who
 * filled out the contact form years ago shows up here.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/server/queries/customers";
import { CustomerEditForm } from "@/components/admin/CustomerEditForm";
import { formatCents, formatDateShort, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerById(id);
  return { title: `${data?.customer.name ?? "Customer"} · Owner Console` };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerById(id);
  if (!data) notFound();

  const { customer, orderHistory, inquiryHistory, stats } = data;

  return (
    <div className="dashboard">
      <Link href="/admin/customers" className="back-link">← All customers</Link>

      <header className="order-detail__head">
        <div>
          <p className="dashboard__eyebrow">Customer</p>
          <h1 className="dashboard__title">{customer.name}</h1>
          <p className="order-detail__sub">
            {stats.totalOrders} {stats.totalOrders === 1 ? "order" : "orders"} · lifetime
            spend {formatCents(stats.totalSpentCents)}
            {stats.lastOrderAt && <> · last seen {formatRelative(stats.lastOrderAt)}</>}
          </p>
        </div>
      </header>

      <div className="dashboard__grid dashboard__grid--two">
        <section className="panel">
          <h2 className="panel__title">Contact + notes</h2>
          <CustomerEditForm
            customerId={customer.id}
            initial={{
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              tags: customer.tags,
              notes: customer.notes,
            }}
          />
        </section>

        <section className="panel">
          <h2 className="panel__title">At a glance</h2>
          <dl className="kv">
            <div>
              <dt>Joined</dt>
              <dd>{formatDateShort(customer.createdAt)}</dd>
            </div>
            <div>
              <dt>First order</dt>
              <dd>{stats.firstOrderAt ? formatDateShort(stats.firstOrderAt) : "—"}</dd>
            </div>
            <div>
              <dt>Last order</dt>
              <dd>{stats.lastOrderAt ? formatDateShort(stats.lastOrderAt) : "—"}</dd>
            </div>
            <div>
              <dt>Avg order</dt>
              <dd>{formatCents(stats.avgOrderCents)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="panel panel--flush">
        <h2 className="panel__title" style={{ padding: "1rem 1rem 0" }}>
          Order history
        </h2>
        {orderHistory.length === 0 ? (
          <p className="panel__empty">No orders yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Requested for</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="num">Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>#{o.number}</Link>
                  </td>
                  <td>{formatDateShort(o.requestedDate)}</td>
                  <td>
                    <span className={`pill pill--${o.status}`}>{o.status.replace("_", " ")}</span>
                  </td>
                  <td>
                    <span className={`pill pill--pay-${o.paymentStatus}`}>{o.paymentStatus}</span>
                  </td>
                  <td className="num">{formatCents(o.totalCents)}</td>
                  <td className="muted">{formatRelative(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {inquiryHistory.length > 0 && (
        <section className="panel panel--flush">
          <h2 className="panel__title" style={{ padding: "1rem 1rem 0" }}>
            Inquiries
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {inquiryHistory.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/admin/inquiries/${q.id}`}>{q.subject ?? "(no subject)"}</Link>
                  </td>
                  <td>
                    <span className={`pill pill--inq-${q.status}`}>{q.status}</span>
                  </td>
                  <td className="muted">{formatRelative(q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
