import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import { requireAuth } from "@/lib/middleware";
import { Order } from "@/models/Order";
import { placeOrder } from "@/services/order.service";
import { PlaceOrderSchema } from "@/types";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = PlaceOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload" },
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

  const orders = await Order.find({ userId: auth.session.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ success: true, data: orders });
}
