"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function extractSegmentId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/segments\/(\d+)/);
  if (match) return match[1];
  return null;
}

export default function SegmentSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractSegmentId(value);
    if (!id) {
      setErr("Paste a Strava segment URL or numeric segment ID.");
      return;
    }
    setErr(null);
    router.push(`/segment/${id}`);
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="search-row">
        <input
          placeholder="Paste a segment URL or ID — e.g. strava.com/segments/42043644"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Look up
        </button>
      </div>
      {err && <div className="error-banner">{err}</div>}
    </form>
  );
}
