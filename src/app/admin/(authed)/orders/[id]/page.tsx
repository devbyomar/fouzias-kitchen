/**
 * Order detail page — single source of truth for one order.
 *
 * Layout: header with #number + status pills + status-action buttons,
 * two columns (line items + customer/totals/notes), then a timeline of
 * status events. Everything except the action buttons + note form is
 * server-rendered.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { allowedNextStatuses, getOrderById } from "@/server/queries/orders";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import { OrderNoteForm } from "@/components/admin/OrderNoteForm";
import { PaymentActions } from "@/components/admin/PaymentActions";
import {
  formatCents,
  formatDate,
  formatDateShort,
  formatRelative,
  formatTime,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) return { title: "Order not found" };
  return { title: `Order #${data.order.number} · Owner Console` };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) notFound();
  const { order, customer, items, events } = data;

  const allowed = allowedNextStatuses(order.status);

  const address =
    order.address && typeof order.address === "object"
      ? (order.address as {
          line1?: string;
          line2?: string;
          city?: string;
          postal?: string;
          instructions?: string;
        })
      : null;

  return (
    <div className="dashboard">
      <header className="order-detail__head">
        <div>
          <p className="dashboard__eyebrow">
            <Link href="/admin/orders" className="back-link">
              ← All orders
            </Link>
          </p>
          <h1 className="dashboard__title">
            Order #{order.number}
            <span className={`pill pill--${order.status}`} style={{ marginLeft: ".75rem" }}>
              {order.status.replace("_", " ")}
            </span>
            <span
              className={`pill pill--pay-${order.paymentStatus}`}
              style={{ marginLeft: ".4rem" }}
            >
              {order.paymentStatus}
            </span>
          </h1>
          <p className="order-detail__sub">
            Placed {formatRelative(order.createdAt)} · {order.fulfillmentType} ·{" "}
            {formatDate(order.requestedDate)}
            {order.requestedTime && ` at ${order.requestedTime}`}
          </p>
        </div>
      </header>

      <section className="panel">
        <header className="panel__head">
          <h2 className="panel__title">Status</h2>
        </header>
        <OrderStatusActions orderId={order.id} allowed={allowed} />
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2 className="panel__title">Payment</h2>
          <span className={`pill pill--pay-${order.paymentStatus}`}>{order.paymentStatus}</span>
        </header>
        <PaymentActions
          orderId={order.id}
          paymentStatus={order.paymentStatus}
          totalCents={order.totalCents}
          amountPaidCents={order.amountPaidCents}
          refundedCents={order.refundedCents}
          hasPaymentIntent={Boolean(order.stripePaymentIntentId)}
        />
      </section>

      <div className="dashboard__grid">
        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Items</h2>
          </header>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Qty</th>
                <th className="num">Unit</th>
                <th className="num">Line</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {it.productName}
                    {it.lineNotes && <div className="muted" style={{ fontSize: ".75rem" }}>{it.lineNotes}</div>}
                  </td>
                  <td className="num">{it.quantity}</td>
                  <td className="num">{formatCents(it.unitPriceCents)}</td>
                  <td className="num">{formatCents(it.unitPriceCents * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="num muted">Subtotal</td>
                <td className="num">{formatCents(order.subtotalCents)}</td>
              </tr>
              {order.deliveryFeeCents > 0 && (
                <tr>
                  <td colSpan={3} className="num muted">Delivery</td>
                  <td className="num">{formatCents(order.deliveryFeeCents)}</td>
                </tr>
              )}
              {order.taxCents > 0 && (
                <tr>
                  <td colSpan={3} className="num muted">Tax</td>
                  <td className="num">{formatCents(order.taxCents)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="num"><strong>Total</strong></td>
                <td className="num"><strong>{formatCents(order.totalCents)}</strong></td>
              </tr>
              {order.amountPaidCents > 0 && (
                <tr>
                  <td colSpan={3} className="num muted">Paid</td>
                  <td className="num">{formatCents(order.amountPaidCents)}</td>
                </tr>
              )}
              {order.refundedCents > 0 && (
                <tr>
                  <td colSpan={3} className="num muted">Refunded</td>
                  <td className="num">−{formatCents(order.refundedCents)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </article>

        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Customer</h2>
          </header>
          {customer ? (
            <dl className="kv">
              <div><dt>Name</dt><dd>{customer.name}</dd></div>
              {customer.phone && <div><dt>Phone</dt><dd>{customer.phone}</dd></div>}
              {customer.email && <div><dt>Email</dt><dd>{customer.email}</dd></div>}
              {customer.notes && <div><dt>Notes</dt><dd>{customer.notes}</dd></div>}
            </dl>
          ) : (
            <p className="panel__empty">Customer record missing.</p>
          )}
          {address && (
            <>
              <h3 className="panel__subhead">Delivery address</h3>
              <p className="address">
                {address.line1}
                {address.line2 && <><br />{address.line2}</>}
                <br />
                {[address.city, address.postal].filter(Boolean).join(", ")}
                {address.instructions && (
                  <>
                    <br />
                    <em className="muted">{address.instructions}</em>
                  </>
                )}
              </p>
            </>
          )}
          {(order.cardBrand || order.cardLast4) && (
            <>
              <h3 className="panel__subhead">Payment</h3>
              <p>
                {order.cardBrand} ···· {order.cardLast4}
              </p>
            </>
          )}
        </article>

        <article className="panel panel--wide">
          <header className="panel__head">
            <h2 className="panel__title">Notes</h2>
          </header>
          {order.notes ? (
            <pre className="notes-pre">{order.notes}</pre>
          ) : (
            <p className="panel__empty">No notes yet.</p>
          )}
          <OrderNoteForm orderId={order.id} />
        </article>

        <article className="panel panel--wide">
          <header className="panel__head">
            <h2 className="panel__title">Timeline</h2>
          </header>
          {events.length === 0 ? (
            <p className="panel__empty">No status events yet.</p>
          ) : (
            <ul className="timeline">
              {events.map((e) => (
                <li key={e.id} className="timeline__row">
                  <div className="timeline__dot" />
                  <div className="timeline__body">
                    <div className="timeline__head">
                      <strong>
                        {e.fromStatus ? `${e.fromStatus.replace("_", " ")} → ` : ""}
                        {e.toStatus.replace("_", " ")}
                      </strong>
                      <span className="muted">
                        {formatDateShort(e.createdAt)} · {formatTime(e.createdAt)}
                      </span>
                    </div>
                    {e.actorEmail && <div className="muted" style={{ fontSize: ".78rem" }}>{e.actorEmail}</div>}
                    {e.note && <p className="timeline__note">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}
