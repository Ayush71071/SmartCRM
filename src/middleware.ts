import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isLoggedIn && !isAuthRoute) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next internals, static assets, the NextAuth API routes (Credentials
  // POST would otherwise get redirected before it can set the session
  // cookie), and other API routes that do their own auth checks.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
