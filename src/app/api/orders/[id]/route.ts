import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { Order } from "@/models/Order";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  const { id } = await params;
  const order = await Order.findOne({
    _id: id,
    userId: auth.session.userId,
  }).lean();

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: order });
}
