import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<{ from?: string; error?: string }>;
}

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "That email isn't on the owner allowlist.",
  Verification: "That sign-in link is no longer valid. Request a new one below.",
  Configuration: "We couldn't reach the email service. Please try again in a moment.",
  default: "Something went wrong. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const from = params.from && params.from.startsWith("/admin") ? params.from : "/admin";

  if (session) redirect(from);

  const errorKey = params.error;
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.default) : null;

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    await signIn("resend", {
      email,
      redirectTo: from,
    });
  }

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
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 4px 24px rgba(90,58,32,0.06)",
        }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
            fontSize: "2rem",
            margin: "0 0 0.25rem",
            color: "#5A3A20",
          }}
        >
          Owner Console
        </h1>
        <p style={{ margin: "0 0 1.5rem", color: "#7A6A58", fontSize: "0.95rem" }}>
          We&apos;ll email you a one-time sign-in link.
        </p>

        {errorMessage && (
          <p
            role="alert"
            style={{
              background: "#FBE9E5",
              color: "#8A2A1A",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              fontSize: "0.9rem",
              margin: "0 0 1rem",
            }}
          >
            {errorMessage}
          </p>
        )}

        <form action={handleSignIn} style={{ display: "grid", gap: "0.75rem" }}>
          <label
            htmlFor="email"
            style={{ fontSize: "0.85rem", color: "#5A3A20", fontWeight: 500 }}
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@fouziaskitchen.com"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid #D9CDB6",
              background: "#FFFEFB",
              fontSize: "1rem",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              background: "#5A3A20",
              color: "#FFFDF8",
              border: 0,
              padding: "0.85rem 1rem",
              borderRadius: 8,
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Send sign-in link
          </button>
        </form>

        <p style={{ margin: "1.5rem 0 0", fontSize: "0.8rem", color: "#9A8A78" }}>
          Access is invite-only. If your email isn&apos;t recognized, contact Fouzia directly.
        </p>
      </section>
    </main>
  );
}
