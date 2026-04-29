/**
 * Products list — server component.
 */

import Link from "next/link";
import { listProducts } from "@/server/queries/products";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Products · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const STATUSES = ["all", "active", "archived"] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = (typeof params.status === "string" && (STATUSES as readonly string[]).includes(params.status)
    ? params.status
    : "active") as (typeof STATUSES)[number];
  const search = typeof params.search === "string" ? params.search : undefined;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const { rows, total, pageSize } = await listProducts({
    status,
    search,
    page,
    pageSize: 50,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">Products</h1>
        </div>
        <div className="dashboard__head-meta">
          <Link href="/admin/products/new" className="btn btn--primary">+ New product</Link>
        </div>
      </header>

      <form className="filters" method="get">
        <div className="filters__row">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by name or slug…"
            className="filters__input"
          />
          <select name="status" defaultValue={status} className="filters__select">
            <option value="active">Active only</option>
            <option value="archived">Archived only</option>
            <option value="all">All</option>
          </select>
          <button type="submit" className="btn btn--primary">Apply</button>
          <Link href="/admin/products" className="btn btn--ghost">Reset</Link>
        </div>
      </form>

      <div className="panel panel--flush">
        {rows.length === 0 ? (
          <p className="panel__empty">No products yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Slug</th>
                <th className="num">Price</th>
                <th className="num">Lead</th>
                <th className="num">Min qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 56 }}>
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid var(--admin-border)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: "var(--admin-bg)",
                          border: "1px solid var(--admin-border)",
                        }}
                      />
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>{p.nameEn}</Link>
                    {p.nameTraditional && (
                      <div className="muted" style={{ fontSize: ".75rem" }}>
                        {p.nameTraditional}
                      </div>
                    )}
                  </td>
                  <td className="muted" style={{ fontFamily: "ui-monospace, monospace", fontSize: ".82rem" }}>
                    {p.slug}
                  </td>
                  <td className="num">
                    {formatCents(p.priceCents)}
                    {p.unitLabel && (
                      <div className="muted" style={{ fontSize: ".7rem" }}>{p.unitLabel}</div>
                    )}
                  </td>
                  <td className="num">{p.leadTimeDays}d</td>
                  <td className="num">{p.minQty}</td>
                  <td>
                    <span className={`pill pill--${p.active ? "fulfilled" : "cancelled"}`}>
                      {p.active ? "active" : "archived"}
                    </span>
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
    <Link href={`/admin/products?${sp.toString()}`} className="btn btn--ghost">
      {children}
    </Link>
  );
}
