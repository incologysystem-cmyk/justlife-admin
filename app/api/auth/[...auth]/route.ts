// app/api/auth/[...auth]/route.ts
import { NextResponse } from "next/server";
import {
  startOtpRoute,
  verifyOtpRoute,
  passwordLoginRoute,
  completeProfileRoute,
  signoutRoute,
} from "@/lib/api.auth";

type ParamsPromise = Promise<{ auth?: string[] }>;
type Ctx = { params: ParamsPromise };

function seg(parts?: string[]) {
  return (parts ?? []).join("/"); // ["otp","start"] -> "otp/start"
}

export async function POST(req: Request, ctx: Ctx) {
  const { auth } = await ctx.params;             // ⬅️ IMPORTANT
  switch (seg(auth)) {
    case "otp/start":  return startOtpRoute(req);
    case "otp/verify": return verifyOtpRoute(req);
    case "login":      return passwordLoginRoute(req);
    case "signout":    return signoutRoute();
    default:           return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { auth } = await ctx.params;             // ⬅️ IMPORTANT
  switch (seg(auth)) {
    case "complete-profile": return completeProfileRoute(req);
    default:                 return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
