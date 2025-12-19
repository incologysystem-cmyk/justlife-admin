import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const TOKEN_COOKIE = "token";

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

/** Server-only read (returns null on client) */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") return null; // guard for client usage

  // Narrow the type and safely call .get(...)
  const store = cookies() as ReturnType<typeof cookies> | any;
  const raw = store?.get?.(TOKEN_COOKIE);
  const token: string | null = raw?.value ?? null;
  return token;
}
