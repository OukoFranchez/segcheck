import { NextRequest, NextResponse } from "next/server";
import { stravaFetch } from "@/lib/strava";

export async function GET(req: NextRequest) {
  try {
    const perPage = req.nextUrl.searchParams.get("per_page") || "10";
    const res = await stravaFetch(`/athlete/activities?per_page=${perPage}`);
    if (!res.ok) {
      return NextResponse.json({ error: `Strava API error (${res.status})` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
