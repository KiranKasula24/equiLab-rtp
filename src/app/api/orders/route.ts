import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/middleware";
import { Order } from "@/models/Order";
import { placeOrder } from "@/services/order.service";
import { PlaceOrderSchema } from "@/types";
import { isMarketOpen } from "@/lib/angelone";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Market hours gate — skip in mock mode so dev workflow isn't blocked
  if (process.env.ANGEL_ONE_MOCK_MODE !== "false" ? false : !isMarketOpen()) {
    return NextResponse.json(
      {
        success: false,
        error: "Market is closed. Trading hours: Mon–Fri 09:15–15:30 IST.",
      },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const parsed = PlaceOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid payload",
        },
        { status: 400 },
      );
    }

    const order = await placeOrder(auth.session.userId, parsed.data);
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);

  const orders = await Order.find({ userId: auth.session.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ success: true, data: orders });
}
