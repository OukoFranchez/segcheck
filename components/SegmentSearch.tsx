"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { extractSegmentId } from "@/lib/strava";

export default function SegmentSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setErr("Please enter a Strava segment link or numeric ID.");
      return;
    }

    // Fast path: immediate direct match
    const directId = extractSegmentId(trimmed);
    if (directId) {
      setErr(null);
      router.push(`/segment/${directId}`);
      return;
    }

    // Slow path: resolve link (e.g. strava.app.link) via server API
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch("/api/segments/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.segmentId) {
        setErr(data.error || "Could not resolve segment ID from the provided link.");
        setLoading(false);
        return;
      }

      router.push(`/segment/${data.segmentId}`);
    } catch {
      setErr("Failed to resolve segment link. Please check your internet connection.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="search-row">
        <input
          placeholder="Paste a segment URL, short link, or ID — e.g. strava.app.link/... or 42043644"
          value={value}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Resolving..." : "Look up"}
        </button>
      </div>
      {err && <div className="error-banner">{err}</div>}
    </form>
  );
}
