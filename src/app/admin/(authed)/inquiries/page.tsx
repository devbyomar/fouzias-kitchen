/**
 * Inquiries inbox — list view with status filter and search.
 */

import Link from "next/link";
import { listInquiries, type InquiryListFilters } from "@/server/queries/inquiries";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Inquiries · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const STATUSES = ["all", "new", "responded", "archived"] as const;

function pickStatus(v: string | string[] | undefined): InquiryListFilters["status"] {
  if (typeof v !== "string") return "new";
  return (STATUSES as readonly string[]).includes(v)
    ? (v as InquiryListFilters["status"])
    : "new";
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters: InquiryListFilters = {
    status: pickStatus(params.status),
    search: typeof params.search === "string" ? params.search : undefined,
    page: typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1,
    pageSize: 25,
  };

  const { rows, total, page, pageSize } = await listInquiries(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">Inquiries</h1>
        </div>
        <div className="dashboard__head-meta">
          {total} {total === 1 ? "inquiry" : "inquiries"}
        </div>
      </header>

      <form className="filters" method="get">
        <div className="filters__row">
          <input
            type="search"
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Search name, email, message…"
            className="filters__input"
          />
          <select name="status" defaultValue={filters.status ?? "new"} className="filters__select">
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
          <button type="submit" className="btn btn--primary">Apply</button>
          <Link href="/admin/inquiries" className="btn btn--ghost">Reset</Link>
        </div>
      </form>

      <div className="panel panel--flush">
        {rows.length === 0 ? (
          <p className="panel__empty">No inquiries match these filters.</p>
        ) : (
          <ul className="inquiry-list inquiry-list--full">
            {rows.map((q) => (
              <li key={q.id} className="inquiry-list__row">
                <div className="inquiry-list__head">
                  <Link href={`/admin/inquiries/${q.id}`} className="inquiry-list__name">
                    {q.rawName}
                  </Link>
                  <span className={`pill pill--inq-${q.status}`}>{q.status}</span>
                  <span className="inquiry-list__time">{formatRelative(q.createdAt)}</span>
                </div>
                <p className="inquiry-list__preview">{q.message}</p>
                <div className="inquiry-list__meta">
                  <span>{q.rawEmail}</span>
                  {q.rawPhone && <span> · {q.rawPhone}</span>}
                  {q.rawDate && <span> · prefers {q.rawDate}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="pager">
          <PageLink filters={params} page={page - 1} disabled={page <= 1}>← Prev</PageLink>
          <span className="pager__info">Page {page} of {totalPages}</span>
          <PageLink filters={params} page={page + 1} disabled={page >= totalPages}>Next →</PageLink>
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
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (typeof v === "string" && v) sp.set(k, v);
  }
  sp.set("page", String(page));
  return (
    <Link href={`/admin/inquiries?${sp.toString()}`} className="btn btn--ghost">
      {children}
    </Link>
  );
}
