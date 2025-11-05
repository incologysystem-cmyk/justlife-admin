// /lib/api.auth.ts
import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "token";

function setAuthCookieOn(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

function clearAuthCookieOn(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

function getTokenServer(): string | null {
  // Narrow the type and safely call .get(...)
  const store = cookies() as ReturnType<typeof cookies> | any;
  return store?.get?.(TOKEN_COOKIE)?.value ?? null;
}

/** POST /api/auth/otp/start */
export async function startOtpRoute(req: Request) {
  const { phone } = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/otp/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status });
}

/** POST /api/auth/otp/verify -> set cookie */
export async function verifyOtpRoute(req: Request) {
  const payload = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  const res = NextResponse.json(j, { status: r.status });
  if (r.ok && j?.token) setAuthCookieOn(res, j.token);
  return res;
}

/** POST /api/auth/login (optional) -> set cookie */
export async function passwordLoginRoute(req: Request) {
  const payload = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  const res = NextResponse.json(j, { status: r.status });
  if (r.ok && j?.token) setAuthCookieOn(res, j.token);
  return res;
}

/** PATCH /api/auth/complete-profile (needs bearer from cookie) */
export async function completeProfileRoute(req: Request) {
  const token = getTokenServer();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/complete-profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  return NextResponse.json(j, { status: r.status });
}

/** POST /api/auth/signout */
export async function signoutRoute() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookieOn(res);
  return res;
}
