import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { getTradeHistory } from "@/services/portfolio.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const symbol = searchParams.get("symbol") ?? undefined;
  const sideParam = searchParams.get("side");
  const side = sideParam === "buy" || sideParam === "sell" ? sideParam : undefined;

  const result = await getTradeHistory(
    auth.session.userId,
    page,
    limit,
    symbol,
    side,
  );

  return NextResponse.json({ success: true, data: result });
}
