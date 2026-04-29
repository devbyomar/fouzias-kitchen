/**
 * Analytics — owner-grade summary over a configurable window.
 */

import Link from "next/link";
import { getAnalyticsSummary } from "@/server/queries/analytics";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Analytics · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const RANGES = [7, 30, 90, 365] as const;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requested = typeof params.range === "string" ? parseInt(params.range, 10) : 30;
  const rangeDays = (RANGES as readonly number[]).includes(requested) ? requested : 30;

  const summary = await getAnalyticsSummary(rangeDays);
  const maxDailyRevenue = Math.max(1, ...summary.daily.map((d) => d.revenueCents));

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">Analytics</h1>
          <p className="order-detail__sub">
            {summary.rangeStart.toLocaleDateString()} – {summary.rangeEnd.toLocaleDateString()}
          </p>
        </div>
        <div className="filters__row">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              className={`btn ${r === rangeDays ? "btn--primary" : "btn--ghost"}`}
            >
              {r === 365 ? "1 year" : `${r} days`}
            </Link>
          ))}
        </div>
      </header>

      <div className="dashboard__stats">
        <Stat label="Net revenue" value={formatCents(summary.netRevenueCents)} sub={`${summary.paidOrders} paid`} />
        <Stat label="Gross revenue" value={formatCents(summary.grossRevenueCents)} sub={`${summary.totalOrders} orders`} />
        <Stat label="Avg order" value={formatCents(summary.avgOrderCents)} sub="per paid order" />
        <Stat label="Refunded" value={formatCents(summary.refundedCents)} sub={summary.refundedCents > 0 ? "in window" : "none"} />
        <Stat label="New customers" value={String(summary.newCustomerCount)} sub="first order in window" />
        <Stat label="Inquiries" value={String(summary.inquiriesCount)} sub="received in window" />
      </div>

      <section className="panel">
        <h2 className="panel__title">Daily revenue</h2>
        {summary.daily.length === 0 ? (
          <p className="panel__empty">No orders in this window yet.</p>
        ) : (
          <div className="bars">
            {summary.daily.map((d) => (
              <div key={d.date} className="bars__col" title={`${d.date} · ${formatCents(d.revenueCents)} · ${d.orderCount} orders`}>
                <div
                  className="bars__bar"
                  style={{ height: `${Math.max(2, (d.revenueCents / maxDailyRevenue) * 100)}%` }}
                />
                <div className="bars__label">{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel panel--flush">
        <h2 className="panel__title" style={{ padding: "1rem 1rem 0" }}>Top products</h2>
        {summary.topProducts.length === 0 ? (
          <p className="panel__empty">No product sales in this window.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Units</th>
                <th className="num">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {summary.topProducts.map((p) => (
                <tr key={p.productId}>
                  <td>
                    <Link href={`/admin/products/${p.productId}`}>{p.name}</Link>
                  </td>
                  <td className="num">{p.units}</td>
                  <td className="num">{formatCents(p.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {sub && <div className="stat__sub">{sub}</div>}
    </div>
  );
}
