// app/api/provider/addons/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function backendUrl(path: string) {
  // e.g. http://localhost:4000/api/provider/addons/:id
  return `${BACKEND_URL?.replace(/\/$/, "")}/api/provider/addons${path}`;
}

// GET /api/provider/addons/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(backendUrl(`/${params.id}`), {
      method: "GET",
      headers: {
        Authorization: req.headers.get("authorization") || "",
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[NEXT] /api/provider/addons/[id] GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch addon" },
      { status: 500 }
    );
  }
}

// PATCH /api/provider/addons/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const res = await fetch(backendUrl(`/${params.id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[NEXT] /api/provider/addons/[id] PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update addon" },
      { status: 500 }
    );
  }
}

// DELETE /api/provider/addons/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(backendUrl(`/${params.id}`), {
      method: "DELETE",
      headers: {
        Authorization: req.headers.get("authorization") || "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[NEXT] /api/provider/addons/[id] DELETE error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete addon" },
      { status: 500 }
    );
  }
}
