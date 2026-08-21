import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";

// Only /admin/* requires authentication. Everything under the customer
// route group intentionally stays open, including checkout, because guest
// checkout is the default ordering experience (Rules doc §4) — the system
// must never force account creation before ordering. Login/register pages
// are excluded from the admin gate below since gating them would create a
// redirect loop.
const PROTECTED_ADMIN_PREFIX = "/admin";
const ADMIN_PUBLIC_PATHS = ["/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith(PROTECTED_ADMIN_PREFIX);
  const isPublicAdminPath = ADMIN_PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isAdminRoute || isPublicAdminPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session || session.accountType !== "ADMIN") {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
