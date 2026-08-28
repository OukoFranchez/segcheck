import { NextRequest, NextResponse } from "next/server";
import { stravaFetch } from "@/lib/strava";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await stravaFetch(`/segments/${id}`);
    if (res.status === 404) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }
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
