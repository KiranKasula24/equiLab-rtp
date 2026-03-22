import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const token = await signToken({
    userId: auth.session.userId,
    email: auth.session.email,
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("equilab_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 15,
    path: "/",
  });

  return res;
}
