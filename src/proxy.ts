import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/auth-error")) {
    return NextResponse.next();
  }
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, cookieName: "medixo-customer.session-token" });
  if (!token?.sessionId) return NextResponse.redirect(new URL("/login?error=Login%20required", request.url));
  try {
    const response = await fetch(`${process.env.API_URL || "http://localhost:4000"}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token.sessionId, expectedRole: "SHOP_OWNER" }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.redirect(new URL("/login?error=Session%20expired", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=Service%20unavailable", request.url));
  }
  if (token.role !== "SHOP_OWNER") {
    return NextResponse.redirect(new URL("/auth-error", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icons/|Logo.png|og-image.jpg|manifest.json|sw.js).*)"],
};
