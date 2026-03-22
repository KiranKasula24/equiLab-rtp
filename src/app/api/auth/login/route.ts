import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { User } from "@/models/User";
import { LoginSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    await connectDB();

    const { email, password } = parsed.data;
    const user = await User.findOne({ email }).select("+passwordHash");

    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, "$2b$12$invalidhashfortimingprotection000000000000000");

    if (!user || !passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signToken({ userId: user._id.toString(), email });
    const res = NextResponse.json({ success: true, data: { user: user.toJSON() } });

    res.cookies.set("equilab_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 15,
      path: "/",
    });

    return res;
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
