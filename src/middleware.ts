import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const PROTECTED_PREFIX = [
  "/dashboard",
  "/trade",
  "/portfolio",
  "/analytics",
  "/history",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("equilab_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIX.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trade/:path*",
    "/portfolio/:path*",
    "/analytics/:path*",
    "/history/:path*",
    "/login",
    "/register",
  ],
};
