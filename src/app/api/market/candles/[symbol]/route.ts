import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/angelone";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { symbol } = await params;
    const { searchParams } = req.nextUrl;
    const exchange = searchParams.get("exchange") ?? "NSE";
    const interval = searchParams.get("interval") ?? "ONE_DAY";
    const from = searchParams.get("from") ?? getDefaultFrom();
    const to = searchParams.get("to") ?? getDefaultTo();

    const candles = await getCandles(
      symbol.toUpperCase(),
      exchange,
      interval,
      from,
      to,
    );

    return NextResponse.json({ success: true, data: candles });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

function getDefaultFrom() {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return date.toISOString().split("T")[0];
}

function getDefaultTo() {
  return new Date().toISOString().split("T")[0];
}
