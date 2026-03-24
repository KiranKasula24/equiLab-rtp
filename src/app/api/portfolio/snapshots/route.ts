import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { connectDB } from "@/lib/db";
import { Snapshot } from "@/models/Snapshot";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  const { searchParams } = req.nextUrl;
  const days = Math.min(Number(searchParams.get("days") ?? "90"), 365);

  const snapshots = await Snapshot.find({ userId: auth.session.userId })
    .sort({ date: 1 })
    .limit(days)
    .lean();

  return NextResponse.json({ success: true, data: snapshots });
}
