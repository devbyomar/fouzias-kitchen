/**
 * NextAuth v5 configuration.
 *
 * Auth model:
 * - Email magic-link only (Resend). No passwords, no OAuth.
 * - Allowlisted by OWNER_EMAIL env var (comma-separated for multiple staff).
 *   Anyone whose email isn't on the allowlist is rejected at signIn time —
 *   no user record is ever created for them.
 * - Database sessions via Drizzle adapter (so the owner can revoke a session
 *   from /admin/settings without rotating the global secret).
 *
 * Exports `auth` for server components / middleware, `handlers` for the
 * route handler, and `signIn`/`signOut` for server actions.
 */

import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { env } from "@/lib/env";
import { renderMagicLinkEmail, sendEmail } from "@/lib/email";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  trustHost: env.AUTH_TRUST_HOST ?? true,
  secret: env.AUTH_SECRET,
  providers: [
    Resend({
      from: env.EMAIL_FROM ?? "Fouzia's Kitchen <onboarding@resend.dev>",
      async sendVerificationRequest({ identifier, url }) {
        const { subject, html, text } = renderMagicLinkEmail({ url, email: identifier });
        await sendEmail({ to: identifier, subject, html, text });
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      // eslint-disable-next-line no-console
      console.info(`[auth:sign-in] ${user.email}`);
    },
  },
});
