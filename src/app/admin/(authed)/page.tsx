/**
 * Owner dashboard — "today at a glance".
 *
 * Server component. Pulls live counts from Postgres on every request
 * (`dynamic = "force-dynamic"`) so the owner never sees a stale screen.
 * Each card links into the section it summarizes — the dashboard doubles
 * as the navigation hub.
 */

import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { Sparkline } from "@/components/admin/Sparkline";
import {
  getDashboardSummary,
  getRecentInquiries,
  getRevenueSeries,
  getTopProducts,
  getUpcomingFulfillments,
} from "@/server/queries/dashboard";
import {
  formatCents,
  formatCentsCompact,
  formatDate,
  formatDateShort,
  formatRelative,
  formatTrend,
} from "@/lib/format";

export const metadata = { title: "Dashboard · Owner Console" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, upcoming, series, top, recent] = await Promise.all([
    getDashboardSummary(),
    getUpcomingFulfillments(7),
    getRevenueSeries(14),
    getTopProducts(30, 5),
    getRecentInquiries(5),
  ]);

  const revenueTrend = formatTrend(summary.weekRevenueCents, summary.prevWeekRevenueCents);
  const orderTrend = formatTrend(summary.weekOrderCount, summary.prevWeekOrderCount);

  const firstPoint = series[0];
  const lastPoint = series[series.length - 1];

  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <div>
          <p className="dashboard__eyebrow">{formatDate(new Date())}</p>
          <h1 className="dashboard__title">Today at a glance</h1>
        </div>
      </header>

      <section className="dashboard__stats">
        <StatCard
          label="Today’s orders"
          value={String(summary.todayOrderCount)}
          hint={summary.todayOrderCount === 0 ? "Quiet so far" : "New + confirmed"}
          href="/admin/orders?range=today"
        />
        <StatCard
          label="Today’s revenue"
          value={formatCents(summary.todayRevenueCents)}
          href="/admin/orders?range=today"
        />
        <StatCard
          label="This week"
          value={formatCentsCompact(summary.weekRevenueCents)}
          hint={`${summary.weekOrderCount} orders`}
          trend={revenueTrend}
          href="/admin/analytics"
        />
        <StatCard
          label="Open orders"
          value={String(summary.openOrderCount)}
          hint="New → ready"
          href="/admin/orders?status=open"
        />
        <StatCard
          label="New inquiries"
          value={String(summary.newInquiryCount)}
          href="/admin/inquiries"
        />
        <StatCard
          label="Unpaid"
          value={String(summary.unpaidOrderCount)}
          hint="Awaiting payment"
          href="/admin/orders?payment=unpaid"
        />
      </section>

      <section className="dashboard__grid">
        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Revenue · last 14 days</h2>
            <span className="panel__meta">{orderTrend.label} orders WoW</span>
          </header>
          <Sparkline
            ariaLabel="Daily revenue for the last 14 days"
            values={series.map((p) => p.revenueCents)}
            width={520}
            height={88}
          />
          <p className="panel__sub">
            {firstPoint ? formatDateShort(firstPoint.date) : ""} —{" "}
            {lastPoint ? formatDateShort(lastPoint.date) : ""}
          </p>
        </article>

        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">Top sellers · last 30 days</h2>
            <Link href="/admin/analytics" className="panel__link">
              See all
            </Link>
          </header>
          {top.length === 0 ? (
            <p className="panel__empty">No sales yet. Once orders land, the leaders show up here.</p>
          ) : (
            <ol className="rank-list">
              {top.map((p, i) => (
                <li key={p.productId} className="rank-list__row">
                  <span className="rank-list__pos">{i + 1}</span>
                  <span className="rank-list__name">{p.nameEn}</span>
                  <span className="rank-list__units">{p.unitsSold} sold</span>
                  <span className="rank-list__amount">{formatCents(p.revenueCents)}</span>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="panel panel--wide">
          <header className="panel__head">
            <h2 className="panel__title">Upcoming · next 7 days</h2>
            <Link href="/admin/calendar" className="panel__link">
              Calendar
            </Link>
          </header>
          {upcoming.length === 0 ? (
            <p className="panel__empty">Nothing scheduled. The week is yours.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {formatDateShort(o.requestedDate)}
                      {o.requestedTime && <span className="muted"> · {o.requestedTime}</span>}
                    </td>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}>#{o.number}</Link>
                    </td>
                    <td>{o.customerName}</td>
                    <td className="cap">{o.fulfillmentType}</td>
                    <td>
                      <span className={`pill pill--${o.status}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="num">{formatCents(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="panel">
          <header className="panel__head">
            <h2 className="panel__title">New inquiries</h2>
            <Link href="/admin/inquiries" className="panel__link">
              Inbox
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="panel__empty">No new inquiries.</p>
          ) : (
            <ul className="inquiry-list">
              {recent.map((q) => (
                <li key={q.id} className="inquiry-list__row">
                  <div className="inquiry-list__head">
                    <span className="inquiry-list__name">{q.rawName}</span>
                    <span className="inquiry-list__time">{formatRelative(q.createdAt)}</span>
                  </div>
                  <p className="inquiry-list__preview">{q.message}</p>
                  <span className="inquiry-list__email">{q.rawEmail}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
