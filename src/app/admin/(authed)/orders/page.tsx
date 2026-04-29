/**
 * Orders list — server component.
 *
 * URL-driven filters so each view is bookmarkable / shareable. The dashboard
 * tiles deep-link here with `?status=open`, `?range=today`, `?payment=unpaid`.
 *
 * Pagination is offset-based (page=N&pageSize=25). For our scale (well under
 * 10k orders/year) this stays well inside Postgres' fast path.
 */

import Link from "next/link";
import { listOrders, type OrderListFilters } from "@/server/queries/orders";
import { formatCents, formatDateShort, formatRelative } from "@/lib/format";

export const metadata = { title: "Orders · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pickFilter<T extends string>(
  v: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  if (typeof v !== "string") return undefined;
  return (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

const STATUSES = ["open", "new", "confirmed", "in_prep", "ready", "fulfilled", "cancelled"] as const;
const PAYMENTS = ["unpaid", "pending", "paid", "refunded", "failed"] as const;
const RANGES = ["today", "week", "month", "all"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const filters: OrderListFilters = {
    status: pickFilter(params.status, STATUSES),
    payment: pickFilter(params.payment, PAYMENTS),
    range: pickFilter(params.range, RANGES),
    search: typeof params.search === "string" ? params.search : undefined,
    page: typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1,
    pageSize: 25,
  };

  const { rows, total, page, pageSize } = await listOrders(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">Orders</h1>
        </div>
        <div className="dashboard__head-meta">
          {total} {total === 1 ? "order" : "orders"}
        </div>
      </header>

      <form className="filters" method="get">
        <div className="filters__row">
          <input
            type="search"
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Search by # or customer…"
            className="filters__input"
          />
          <select name="status" defaultValue={filters.status ?? ""} className="filters__select">
            <option value="">All statuses</option>
            <option value="open">Open (any active)</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_prep">In prep</option>
            <option value="ready">Ready</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select name="payment" defaultValue={filters.payment ?? ""} className="filters__select">
            <option value="">Any payment</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <select name="range" defaultValue={filters.range ?? ""} className="filters__select">
            <option value="">All time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          <button type="submit" className="btn btn--primary">Apply</button>
          <Link href="/admin/orders" className="btn btn--ghost">Reset</Link>
        </div>
      </form>

      <div className="panel panel--flush">
        {rows.length === 0 ? (
          <p className="panel__empty">No orders match these filters.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Pickup / Delivery</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="num">Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>#{o.number}</Link>
                  </td>
                  <td>
                    <div>{o.customerName}</div>
                    {o.customerEmail && (
                      <div className="muted" style={{ fontSize: ".75rem" }}>
                        {o.customerEmail}
                      </div>
                    )}
                  </td>
                  <td className="cap">{o.fulfillmentType}</td>
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
      </div>

      {totalPages > 1 && (
        <nav className="pager">
          <PageLink filters={params} page={page - 1} disabled={page <= 1}>
            ← Prev
          </PageLink>
          <span className="pager__info">
            Page {page} of {totalPages}
          </span>
          <PageLink filters={params} page={page + 1} disabled={page >= totalPages}>
            Next →
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  filters,
  page,
  disabled,
  children,
}: {
  filters: SearchParams;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) return <span className="btn btn--ghost btn--disabled">{children}</span>;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (typeof v === "string" && v) params.set(k, v);
  }
  params.set("page", String(page));
  return (
    <Link href={`/admin/orders?${params.toString()}`} className="btn btn--ghost">
      {children}
    </Link>
  );
}
