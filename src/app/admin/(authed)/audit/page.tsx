/**
 * Audit log viewer — chronological feed of every recorded mutation.
 */

import Link from "next/link";
import { listAuditLogs, listAuditEntities } from "@/server/queries/audit";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Audit log · Owner Console" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const entity = typeof params.entity === "string" ? params.entity : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const [{ rows, total, pageSize }, entities] = await Promise.all([
    listAuditLogs({ entity, search, page, pageSize: 50 }),
    listAuditEntities(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="dashboard">
      <header className="dashboard__head dashboard__head--row">
        <div>
          <p className="dashboard__eyebrow">Owner Console</p>
          <h1 className="dashboard__title">Audit log</h1>
        </div>
        <div className="dashboard__head-meta">
          {total} {total === 1 ? "event" : "events"}
        </div>
      </header>

      <form className="filters" method="get">
        <div className="filters__row">
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by entity ID or action…"
            className="filters__input"
          />
          <select name="entity" defaultValue={entity ?? ""} className="filters__select">
            <option value="">All entities</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <button type="submit" className="btn btn--primary">Apply</button>
          <Link href="/admin/audit" className="btn btn--ghost">Reset</Link>
        </div>
      </form>

      <div className="panel panel--flush">
        {rows.length === 0 ? (
          <p className="panel__empty">No audit events match these filters.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Entity</th>
                <th>ID</th>
                <th>Action</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted">{formatRelative(r.createdAt)}</td>
                  <td>{r.actorEmail ?? <span className="muted">system</span>}</td>
                  <td>
                    <span className="pill">{r.entity}</span>
                  </td>
                  <td className="muted" style={{ fontFamily: "ui-monospace, monospace", fontSize: ".78rem" }}>
                    {r.entityId}
                  </td>
                  <td>{r.action}</td>
                  <td>
                    {r.diff ? (
                      <details>
                        <summary className="muted" style={{ cursor: "pointer", fontSize: ".82rem" }}>view</summary>
                        <pre className="audit-diff">{JSON.stringify(r.diff, null, 2)}</pre>
                      </details>
                    ) : (
                      <span className="muted">—</span>
                    )}
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
    <Link href={`/admin/audit?${sp.toString()}`} className="btn btn--ghost">{children}</Link>
  );
}
