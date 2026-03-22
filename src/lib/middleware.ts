import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SessionPayload } from "./auth";

export async function requireAuth(
  req: NextRequest,
): Promise<{ session: SessionPayload } | NextResponse> {
  const token = req.cookies.get("equilab_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  return { session };
}
