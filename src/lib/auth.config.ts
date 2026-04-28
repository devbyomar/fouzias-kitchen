/**
 * Edge-safe NextAuth config — used by `middleware.ts`.
 *
 * Critically: this file does NOT import the Drizzle adapter, postgres-js,
 * or any Node-only dependency. The middleware runs on the Edge runtime,
 * so anything imported here must be Edge-compatible.
 *
 * The full config (with adapter + Resend provider) lives in `./auth.ts` and
 * is used by API routes, server actions, and server components.
 */

import type { NextAuthConfig } from "next-auth";
import { ownerEmailAllowlist } from "@/lib/env";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login/verify",
    error: "/admin/login",
  },
  providers: [], // Real providers attached in ./auth.ts
  callbacks: {
    authorized({ auth }) {
      // Used by middleware: a non-null session is enough to enter /admin/*.
      return !!auth?.user;
    },
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;
      return ownerEmailAllowlist().has(email);
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // @ts-expect-error: role column augmented in src/types/next-auth.d.ts
        session.user.role = user.role ?? "owner";
      }
      return session;
    },
  },
};
