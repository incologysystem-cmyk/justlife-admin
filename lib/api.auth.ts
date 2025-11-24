// /lib/api.auth.ts
import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "token";
const ADMIN_COOKIE = "cm_admin_token";

function setAuthCookieOn(res: NextResponse, token: string, role?: string) {
  // Generic token (customer / provider / admin sab ke liye)
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Agar admin hai to admin cookie bhi set karo
  if (role === "admin") {
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}

function clearAuthCookieOn(res: NextResponse) {
  // Generic token clear
  res.cookies.set(TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  // Admin token clear
  res.cookies.set(ADMIN_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}

function getTokenServer(): string | null {
  const store = cookies() as ReturnType<typeof cookies> | any;
  return store?.get?.(TOKEN_COOKIE)?.value ?? null;
}

/** POST /api/auth/otp/start */
export async function startOtpRoute(req: Request) {
  // 🧾 body parse
  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 🔗 original URL se query nikaalo
  const incomingUrl = new URL(req.url);
  const search = incomingUrl.search || ""; // e.g. "?requireProvider=1"

  // 🔥 backend URL me bhi same query lagao
  const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/otp/start${search}`;

  console.log("[NEXT] /api/auth/otp/start incoming body:", body);
  console.log("[NEXT] /api/auth/otp/start forwarding to:", backendUrl);

  const r = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await r.text().catch(() => "");
  let j: any = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    j = { raw: text };
  }

  console.log(
    "[NEXT] /api/auth/otp/start backend response:",
    r.status,
    JSON.stringify(j)
  );

  return NextResponse.json(j, { status: r.status });
}

/** POST /api/auth/otp/verify -> set cookie(s) */
export async function verifyOtpRoute(req: Request) {
  const payload = await req.json().catch(() => ({} as any));

  console.log("[NEXT] /api/auth/otp/verify incoming body:", payload);

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/otp/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const j = await r.json().catch(() => ({} as any));

  console.log(
    "[NEXT] /api/auth/otp/verify backend response:",
    r.status,
    JSON.stringify(j)
  );

  const res = NextResponse.json(j, { status: r.status });

  if (r.ok && j?.token) {
    const role = j?.user?.role as string | undefined;
    setAuthCookieOn(res, j.token, role);
  }

  return res;
}

/** POST /api/auth/login (optional) -> set cookie(s) */
export async function passwordLoginRoute(req: Request) {
  const payload = await req.json().catch(() => ({} as any));

  console.log("[NEXT] /api/auth/login incoming body:", payload);

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const j = await r.json().catch(() => ({} as any));

  console.log(
    "[NEXT] /api/auth/login backend response:",
    r.status,
    JSON.stringify(j)
  );

  const res = NextResponse.json(j, { status: r.status });

  if (r.ok && j?.token) {
    const role = j?.user?.role as string | undefined;
    setAuthCookieOn(res, j.token, role);
  }

  return res;
}

/** PATCH /api/auth/complete-profile (needs bearer from cookie) */
export async function completeProfileRoute(req: Request) {
  const token = getTokenServer();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const payload = await req.json().catch(() => ({} as any));

  console.log("[NEXT] /api/auth/complete-profile incoming body:", payload);

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/complete-profile`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const j = await r.json().catch(() => ({} as any));
  return NextResponse.json(j, { status: r.status });
}

/** POST /api/auth/signout */
export async function signoutRoute() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookieOn(res);
  return res;
}
