import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/middleware";
import { getPortfolioSummary } from "@/services/portfolio.service";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const summary = await getPortfolioSummary(auth.session.userId);
    return NextResponse.json({ success: true, data: summary });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
