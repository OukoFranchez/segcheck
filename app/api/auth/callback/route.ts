import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, setSessionCookies, COOKIE_OAUTH_STATE, getCookieOptions } from "@/lib/strava";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get(COOKIE_OAUTH_STATE)?.value;

  const createRedirectResponse = (url: URL) => {
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE_OAUTH_STATE, "", {
      ...getCookieOptions(),
      maxAge: 0,
    });
    return res;
  };

  if (error) {
    return createRedirectResponse(new URL(`/?error=${encodeURIComponent(error)}`, req.nextUrl.origin));
  }
  if (!state || !savedState || state !== savedState) {
    return createRedirectResponse(new URL("/?error=invalid_state", req.nextUrl.origin));
  }
  if (!code) {
    return createRedirectResponse(new URL("/?error=missing_code", req.nextUrl.origin));
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    await setSessionCookies(tokens);
  } catch (e) {
    console.error(e);
    return createRedirectResponse(new URL("/?error=token_exchange_failed", req.nextUrl.origin));
  }

  return createRedirectResponse(new URL("/dashboard", req.nextUrl.origin));
}
