// lib/url.ts

export function withOrigin(path: string) {
  if (typeof window !== "undefined") return path;

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  return base.replace(/\/$/, "") + path;
}

/**
 * Build a RequestInit with cookies attached.
 * Compatible with Next.js 13 → 15.
 */
export async function withServerCookies(init: RequestInit = {}): Promise<RequestInit> {
  if (typeof window !== "undefined") return init; // browser auto-sends cookies

  const { cookies } = await import("next/headers");

  // ✅ must await cookies() in Next 15+
  const cookieStore: any = await cookies();

  let allCookies: Array<{ name: string; value: string }> = [];

  try {
    if (typeof cookieStore.getAll === "function") {
      // Normal path for stable Next.js versions
      allCookies = cookieStore.getAll();
    } else if (Symbol.iterator in Object(cookieStore)) {
      // Fallback for iterable style
      allCookies = Array.from(cookieStore).map(([name, cookie]: any) => ({
        name,
        value: cookie?.value ?? "",
      }));
    }
  } catch (err) {
    console.warn("⚠️ Could not read cookies:", err);
  }

  const cookieHeader = allCookies.map(({ name, value }) => `${name}=${value}`).join("; ");

  return {
    ...init,
    headers: {
      ...(init.headers as HeadersInit),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  };
}
