import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }


  const isAdmin =
    pathname === "/" ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/providers") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/settings");

  if (!isAdmin) return NextResponse.next();

  const hasToken = req.cookies.get("token")?.value;
  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
