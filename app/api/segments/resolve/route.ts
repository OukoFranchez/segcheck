import { NextRequest, NextResponse } from "next/server";
import { resolveSegmentId } from "@/lib/strava";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid url parameter" }, { status: 400 });
    }

    const segmentId = await resolveSegmentId(url);
    if (!segmentId) {
      return NextResponse.json(
        { error: "Could not find a Strava segment from the provided link or input." },
        { status: 404 }
      );
    }

    return NextResponse.json({ segmentId });
  } catch (err) {
    console.error("Resolve route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
