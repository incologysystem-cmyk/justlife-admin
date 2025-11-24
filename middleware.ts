import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Public routes: login/signup/api-auth ko skip karo
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/admin/login") || // admin login bhi public
    pathname.startsWith("/provider/login") // agar separate provider login hai
  ) {
    return NextResponse.next();
  }

  // 2) Provider app protected routes (tumhara provider dashboard)
  const isProviderRoute =
    pathname === "/" ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/providers") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/settings");

  if (isProviderRoute) {
    const providerToken = req.cookies.get("token")?.value;

    if (!providerToken) {
      const url = req.nextUrl.clone();
      url.pathname = "/login"; // ya "/provider/login" agar tum wahan rakhna chaho
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 3) Admin app protected routes
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    const adminToken = req.cookies.get("cm_admin_token")?.value;

    if (!adminToken) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 4) Sab baaki routes free hain (public pages etc.)
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
