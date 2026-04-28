import { auth, signOut } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

export default async function AdminIndexPage() {
  const session = await auth();

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg, #FAF6EE)",
        padding: "3rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 600,
              fontSize: "2.25rem",
              margin: 0,
              color: "#5A3A20",
            }}
          >
            Owner Console
          </h1>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "1px solid #D9CDB6",
                color: "#5A3A20",
                padding: "0.5rem 0.9rem",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Sign out
            </button>
          </form>
        </header>

        <section
          style={{
            background: "#FFFDF8",
            border: "1px solid #ECE3D2",
            borderRadius: 14,
            padding: "2rem",
          }}
        >
          <p style={{ margin: "0 0 0.5rem", color: "#7A6A58", fontSize: "0.85rem" }}>
            Signed in as
          </p>
          <p
            style={{
              margin: "0 0 1.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.6rem",
              color: "#5A3A20",
            }}
          >
            {session?.user?.email ?? "—"}
          </p>
          <p style={{ margin: 0, color: "#5A4838", lineHeight: 1.6 }}>
            Welcome to the owner console. The full dashboard, orders, inquiries,
            customers, products, calendar, analytics, settings, and audit log
            ship in the next commits — this scaffold confirms auth is working
            end-to-end.
          </p>
        </section>
      </div>
    </main>
  );
}
