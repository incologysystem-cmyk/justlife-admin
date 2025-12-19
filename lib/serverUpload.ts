import "server-only";

const API = process.env.NEXT_PUBLIC_API_BASE!.replace(/\/$/, "");

export async function serverUpload<T = any>(path: string, fd: FormData, headersIn?: HeadersInit) {
  const headers = new Headers(headersIn || {});
  const res = await fetch(`${API}${path}`, { method: "POST", headers, body: fd, cache: "no-store" });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.message || "Upload failed";
    throw new Error(message);
  }
  return data as T;
}
