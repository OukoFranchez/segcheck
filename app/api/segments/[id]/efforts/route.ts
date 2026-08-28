import { NextRequest, NextResponse } from "next/server";
import { stravaFetch } from "@/lib/strava";

// Returns the authenticated athlete's own efforts on this segment.
// Note: Strava's public cross-athlete leaderboard endpoint was deprecated
// for most API apps, so this shows YOUR effort history only - still useful
// for tracking progress over time on a segment.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const perPage = req.nextUrl.searchParams.get("per_page") || "30";
    const res = await stravaFetch(`/segments/${id}/all_efforts?per_page=${perPage}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Strava API error (${res.status})`, detail: await res.text() },
        { status: res.status }
      );
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
