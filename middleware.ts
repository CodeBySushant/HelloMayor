import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isAdmin = req.cookies.get("admin-auth");

  console.log("PATH:", pathname);

  // ✅ VERY IMPORTANT: allow these routes
  if (
    pathname.startsWith("/api") ||     // allow all APIs
    pathname.startsWith("/login") ||   // allow login page
    pathname.startsWith("/_next") ||   // allow Next.js internals
    pathname.includes(".")             // allow static files
  ) {
    return NextResponse.next();
  }

  // 🔒 protect admin
  if (!isAdmin && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"], // apply to all routes
};