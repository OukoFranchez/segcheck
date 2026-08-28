import { NextResponse } from "next/server";
import { stravaFetch } from "@/lib/strava";

export async function GET() {
  try {
    const athleteRes = await stravaFetch("/athlete");
    if (!athleteRes.ok) {
      return NextResponse.json({ error: `Strava API error (${athleteRes.status})` }, { status: athleteRes.status });
    }
    const athlete = await athleteRes.json();

    const statsRes = await stravaFetch(`/athletes/${athlete.id}/stats`);
    const stats = statsRes.ok ? await statsRes.json() : null;

    return NextResponse.json({ athlete, stats });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_AUTHENTICATED") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
