"use client";

/**
 * Admin sidebar — collapsible on mobile, persistent on desktop.
 *
 * Uses the same brown/cream brand palette as the marketing site so the
 * console feels like one product, not two. Active link is matched on path
 * prefix so nested routes (e.g. /admin/orders/abc) keep the section lit.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string };

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "•" },
  { href: "/admin/orders", label: "Orders", icon: "•" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "•" },
  { href: "/admin/customers", label: "Customers", icon: "•" },
  { href: "/admin/products", label: "Products", icon: "•" },
  { href: "/admin/calendar", label: "Calendar", icon: "•" },
  { href: "/admin/analytics", label: "Analytics", icon: "•" },
  { href: "/admin/settings", label: "Settings", icon: "•" },
  { href: "/admin/audit", label: "Audit", icon: "•" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile scrim */}
      <div
        className={`admin-scrim ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-sidebar__brand">
          <Link href="/admin" onClick={onClose}>
            <span className="admin-sidebar__brand-mark">F</span>
            <span className="admin-sidebar__brand-text">
              Fouzia&rsquo;s Kitchen
              <small>Owner Console</small>
            </span>
          </Link>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`admin-sidebar__link ${isActive(pathname, item.href) ? "is-active" : ""}`}
            >
              <span aria-hidden="true" className="admin-sidebar__bullet">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__foot">
          <Link href="/" className="admin-sidebar__back">
            ← View public site
          </Link>
        </div>
      </aside>
    </>
  );
}

/** Wraps `Sidebar` + `TopBar` with shared open/close state. */
export function SidebarController({
  topBar,
  children,
}: {
  topBar: (props: { onMenu: () => void }) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="admin-main">
        {topBar({ onMenu: () => setOpen((v) => !v) })}
        <div className="admin-content">{children}</div>
      </div>
    </>
  );
}
