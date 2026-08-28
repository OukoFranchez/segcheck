import { NextRequest, NextResponse } from "next/server";
import { getAuthorizeUrl, COOKIE_OAUTH_STATE, getCookieOptions } from "@/lib/strava";

export async function GET(req: NextRequest) {
  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/auth/callback", req.nextUrl.origin).toString();
  const url = getAuthorizeUrl(redirectUri, state);

  const response = NextResponse.redirect(url);
  response.cookies.set(COOKIE_OAUTH_STATE, state, {
    ...getCookieOptions(),
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
