export const metadata = {
  title: "Check your email",
  robots: { index: false, follow: false },
};

export default function VerifyRequestPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg, #FAF6EE)",
        padding: "2rem 1rem",
      }}
    >
      <section
        style={{
          background: "#FFFDF8",
          border: "1px solid #ECE3D2",
          borderRadius: 14,
          padding: "2.5rem 2rem",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(90,58,32,0.06)",
        }}
      >
        <div
          aria-hidden
          style={{ fontSize: "3rem", lineHeight: 1, margin: "0 0 0.5rem" }}
        >
          ✉️
        </div>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: "1.75rem",
            margin: "0 0 0.5rem",
            color: "#5A3A20",
          }}
        >
          Check your email
        </h1>
        <p style={{ margin: "0 0 1rem", color: "#5A4838", lineHeight: 1.55 }}>
          We just sent you a one-time sign-in link. Open it on this device to
          continue to the owner console.
        </p>
        <p style={{ margin: 0, color: "#9A8A78", fontSize: "0.85rem" }}>
          The link expires in 24 hours and can only be used once. Didn&apos;t
          arrive? Check spam, then{" "}
          <a href="/admin/login" style={{ color: "#5A3A20" }}>
            request a new one
          </a>
          .
        </p>
      </section>
    </main>
  );
}
