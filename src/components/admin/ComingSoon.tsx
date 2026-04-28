/**
 * Reusable "coming in next commit" placeholder for nav targets that don't
 * have their full implementation yet. Keeps the sidebar from 404'ing.
 */

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <p className="dashboard__eyebrow">Owner Console</p>
        <h1 className="dashboard__title">{title}</h1>
      </header>
      <div className="panel">
        <p className="panel__empty" style={{ padding: "2.5rem 0" }}>
          {note ?? "Coming in the next commit."}
        </p>
      </div>
    </div>
  );
}
