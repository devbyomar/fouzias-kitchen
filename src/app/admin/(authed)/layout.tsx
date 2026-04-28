/**
 * Admin chrome layout — wraps every authenticated /admin/* route.
 *
 * Defense in depth: middleware already redirects unauthenticated users away,
 * but we re-check `auth()` here so a misconfigured matcher can never leak
 * data. Render the sidebar + topbar around `children`.
 *
 * The sign-out flow is a server action defined inline so we don't ship the
 * NextAuth client bundle to the browser.
 */

import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { SidebarController } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";

export const dynamic = "force-dynamic";

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  async function handleSignOut(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="admin-shell">
      <SidebarController
        topBar={({ onMenu }) => (
          <TopBar
            email={session!.user!.email!}
            onMenu={onMenu}
            signOutAction={handleSignOut}
          />
        )}
      >
        {children}
      </SidebarController>
    </div>
  );
}
