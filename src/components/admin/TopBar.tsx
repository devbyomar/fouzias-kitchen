"use client";

/**
 * Admin top bar — page title (slot from layout), mobile menu button, and a
 * compact account block with sign-out. Uses a server-action wired through
 * NextAuth's `signOut` from `@/lib/auth` (passed in from the server layout).
 */

import { useTransition } from "react";

export function TopBar({
  email,
  onMenu,
  signOutAction,
}: {
  email: string;
  onMenu: () => void;
  signOutAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <header className="admin-topbar">
      <button
        type="button"
        className="admin-topbar__menu"
        aria-label="Open navigation"
        onClick={onMenu}
      >
        <span /> <span /> <span />
      </button>
      <div className="admin-topbar__title" />
      <div className="admin-topbar__account">
        <span className="admin-topbar__email" title={email}>
          {email}
        </span>
        <form
          action={() => {
            startTransition(() => signOutAction());
          }}
        >
          <button type="submit" className="admin-topbar__signout" disabled={pending}>
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </form>
      </div>
    </header>
  );
}
