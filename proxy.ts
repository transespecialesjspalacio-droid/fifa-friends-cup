import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-core";

export function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET?.trim();
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (secret && session && verifySessionToken(session, secret)) {
    return NextResponse.next();
  }
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};