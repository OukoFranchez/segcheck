import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, setSessionCookies } from "@/lib/strava";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, req.nextUrl.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.nextUrl.origin));
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    await setSessionCookies(tokens);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", req.nextUrl.origin));
  }

  return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
}
