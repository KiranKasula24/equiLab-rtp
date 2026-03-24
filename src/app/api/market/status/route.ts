import { NextResponse } from "next/server";
import { isMarketOpen } from "@/lib/angelone";

export async function GET() {
  const open = isMarketOpen();
  const now = new Date();
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60_000;
  const ist = new Date(utcMillis + 5.5 * 60 * 60 * 1000);
  const timeIst = ist.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return NextResponse.json({
    success: true,
    data: {
      isOpen: open,
      message: open ? "Market open" : "Market closed",
      istTime: timeIst,
      hours: "Mon–Fri 09:15–15:30 IST",
    },
  });
}
