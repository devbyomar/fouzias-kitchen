/**
 * Customers list — server component.
 */

import Link from "next/link";
import { listCustomers } from "@/server/queries/customers";
import { formatCents, formatRelative } from "@/lib/format";

export const metadata = { title: "Customers · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;
  const search = typeof params.search === "string" ? params.search : undefined;

  const { rows, total, pageSize } = await listCustomers({ search, page, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">Customers</h1>
        </div>
        <div className="dashboard__head-meta">
          {total} {total === 1 ? "customer" : "customers"}
        </div>
      </header>

      <form className="filters" method="get">
        <div className="filters__row">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by name, email, or phone…"
            className="filters__input"
          />
          <button type="submit" className="btn btn--primary">Apply</button>
          <Link href="/admin/customers" className="btn btn--ghost">Reset</Link>
        </div>
      </form>

      <div className="panel panel--flush">
        {rows.length === 0 ? (
          <p className="panel__empty">No customers match these filters.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Tags</th>
                <th className="num">Orders</th>
                <th className="num">Lifetime spend</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/customers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>
                    {c.email && <div>{c.email}</div>}
                    {c.phone && (
                      <div className="muted" style={{ fontSize: ".75rem" }}>{c.phone}</div>
                    )}
                  </td>
                  <td>
                    {c.tags.length ? (
                      c.tags.map((t) => (
                        <span key={t} className="pill" style={{ marginRight: 4 }}>
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="num">{c.totalOrders}</td>
                  <td className="num">{formatCents(c.totalSpentCents)}</td>
                  <td className="muted">
                    {c.lastOrderAt ? formatRelative(c.lastOrderAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="pager">
          <PageLink params={params} page={page - 1} disabled={page <= 1}>← Prev</PageLink>
          <span className="pager__info">Page {page} of {totalPages}</span>
          <PageLink params={params} page={page + 1} disabled={page >= totalPages}>Next →</PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  params,
  page,
  disabled,
  children,
}: {
  params: SearchParams;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) return <span className="btn btn--ghost btn--disabled">{children}</span>;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v) sp.set(k, v);
  }
  sp.set("page", String(page));
  return (
    <Link href={`/admin/customers?${sp.toString()}`} className="btn btn--ghost">
      {children}
    </Link>
  );
}
