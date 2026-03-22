import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { User } from "@/models/User";
import { setupNewUserAccounts } from "@/services/ledger.service";
import { RegisterSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    await connectDB();
    const { email, password, fullName } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, fullName });
    await setupNewUserAccounts(user._id.toString());

    const token = await signToken({ userId: user._id.toString(), email });
    const res = NextResponse.json({ success: true, data: { user: user.toJSON() } }, { status: 201 });

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
