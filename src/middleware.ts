/**
 * Edge middleware — gates everything under /admin/* behind a valid session.
 *
 * Redirects unauthenticated visitors to /admin/login with a `from=` param so
 * we can bounce them back to the original destination after they sign in.
 *
 * The login page itself is intentionally excluded.
 */

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  // Allow the auth UI itself.
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Only guard /admin and its descendants.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("from", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on /admin/* only. /api/auth/* is handled inside the callback above.
  matcher: ["/admin/:path*"],
};
