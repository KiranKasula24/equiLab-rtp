import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const dashboardPrefix = "/dashboard";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("equilab_token")?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(dashboardPrefix) && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};

