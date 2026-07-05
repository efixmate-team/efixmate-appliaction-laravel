import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_PROTECTED = [
  "/dashboard",
  "/bookings",
  "/profile",
  "/wallet",
  "/addresses",
  "/support",
  "/notifications",
  "/cart",
  "/checkout",
];

function isTokenExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function hasValidToken(token?: string): boolean {
  return !!token && !isTokenExpired(token);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get("efm_a_token")?.value;
  const userToken = request.cookies.get("efm_u_token")?.value;

  const hasValidAdminToken = hasValidToken(adminToken);
  const hasValidUserToken = hasValidToken(userToken);

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/login-dev") {
      if (hasValidAdminToken) {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url)
        );
      }
      return NextResponse.next();
    }
    if (!hasValidAdminToken) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      if (adminToken) response.cookies.delete("efm_a_token");
      return response;
    }
    return NextResponse.next();
  }

  // ── Customer protected routes ─────────────────────────────────────────────
  if (USER_PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!hasValidUserToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Customer login page ───────────────────────────────────────────────────
  if (pathname === "/login") {
    if (hasValidUserToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (userToken) {
      const response = NextResponse.next();
      response.cookies.delete("efm_u_token");
      return response;
    }
  }

  // ── Technician routes ─────────────────────────────────────────────────────
  // Token is in localStorage; allow through and let the client redirect on mount.
  // TODO: move technician token to httpOnly cookie for server-side protection.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/wallet/:path*",
    "/addresses/:path*",
    "/support/:path*",
    "/notifications/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    "/technician/:path*",
    "/login",
  ],
};
