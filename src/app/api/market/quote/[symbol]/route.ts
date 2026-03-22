import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/middleware";
import { getQuote } from "@/lib/angelone";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { symbol } = await params;
    const exchange = req.nextUrl.searchParams.get("exchange") ?? "NSE";
    const quote = await getQuote(symbol.toUpperCase(), exchange);
    return NextResponse.json({ success: true, data: quote });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 404 },
    );
  }
}
