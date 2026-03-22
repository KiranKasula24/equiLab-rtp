import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/angelone";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const query = req.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const result = await searchSymbols(query);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
