import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export async function middleware(req: NextRequest) {
  const refreshToken = req.cookies.get("strava_refresh_token")?.value;
  const accessToken = req.cookies.get("strava_access_token")?.value;
  const expiresAt = Number(req.cookies.get("strava_expires_at")?.value || 0);

  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Not logged in -> redirect protected page routes to login
  if (!refreshToken) {
    if (
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/segment")
    ) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = !accessToken || expiresAt - nowSec <= 60;

  if (isExpired && refreshToken) {
    try {
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.next();
      }

      const res = await fetch(STRAVA_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (res.ok) {
        const tokens = await res.json();

        // Forward updated cookies to downstream request & response
        const requestHeaders = new Headers(req.headers);
        const nextResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax" as const,
          path: "/",
          maxAge: 60 * 60 * 24 * 90,
        };

        nextResponse.cookies.set("strava_access_token", tokens.access_token, cookieOptions);
        nextResponse.cookies.set("strava_refresh_token", tokens.refresh_token, cookieOptions);
        nextResponse.cookies.set("strava_expires_at", String(tokens.expires_at), cookieOptions);

        return nextResponse;
      }
    } catch (e) {
      console.error("Middleware token refresh error:", e);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/segment/:path*",
    "/api/athlete/:path*",
    "/api/segments/:path*",
  ],
};
