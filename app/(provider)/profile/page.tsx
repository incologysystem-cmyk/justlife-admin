"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type ProviderMe = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
};

function pickId(input: any) {
  const id = String(input?.id ?? input?._id ?? "").trim();
  return id || "";
}

export default function ProviderProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<ProviderMe | null>(null);

  // editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const meId = useMemo(() => pickId(me), [me]);

  async function fetchMe() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/provider/me", {
        credentials: "include",
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || j?.message || "Failed to load profile");

      const data: ProviderMe = j?.provider || j?.user || j?.me || j || null;
      if (!data) throw new Error("Profile not found");

      setMe(data);
      setName(String(data.name || ""));
      setPhone(String(data.phone || ""));
    } catch (e: any) {
      setError(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!meId) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/provider/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || j?.message || "Failed to update profile");

      const updated: ProviderMe = j?.provider || j?.user || j?.me || j || null;
      setMe(updated || me);
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold">Provider Profile</h1>
          <p className="text-sm opacity-70">Manage your profile info</p>
        </div>

        <button
          onClick={() => router.back()}
          className="text-sm px-3 py-2 rounded-lg border hover:bg-card"
        >
          Back
        </button>
      </div>

      <div className="rounded-xl border bg-background">
        <div className="p-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border bg-card overflow-hidden flex items-center justify-center">
              {me?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold opacity-80">
                  {(me?.name || "P").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-medium">
                {me?.name || (loading ? "Loading..." : "—")}
              </div>
              <div className="text-xs opacity-70">{me?.email || ""}</div>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="animate-spin" size={16} /> Loading...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-xs opacity-70">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 px-3 rounded-lg border bg-transparent"
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs opacity-70">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 px-3 rounded-lg border bg-transparent"
                  placeholder="+971..."
                />
              </div>

              <div className="grid gap-2">
                <label className="text-xs opacity-70">Email (read-only)</label>
                <input
                  value={me?.email || ""}
                  readOnly
                  className="h-10 px-3 rounded-lg border bg-transparent opacity-70"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                  Save changes
                </button>

                <button
                  onClick={fetchMe}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border hover:bg-card disabled:opacity-60"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] opacity-60 mt-4">
        Endpoint used: <code className="px-1 py-0.5 border rounded">/api/provider/me</code>
      </div>
    </div>
  );
}
