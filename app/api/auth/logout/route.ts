import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/strava";

export async function POST(req: NextRequest) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL("/", req.nextUrl.origin));
}
