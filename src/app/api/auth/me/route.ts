import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();
  const user = await User.findById(auth.session.userId).lean();

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
    },
  });
}
