import { NextRequest, NextResponse } from "next/server";
import { getAuthorizeUrl } from "@/lib/strava";

export async function GET(req: NextRequest) {
  const redirectUri = new URL("/api/auth/callback", req.nextUrl.origin).toString();
  const url = getAuthorizeUrl(redirectUri);
  return NextResponse.redirect(url);
}
