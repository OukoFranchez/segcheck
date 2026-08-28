import { redirect } from "next/navigation";
import { isLoggedIn, stravaFetch } from "@/lib/strava";

function km(meters: number) {
  return (meters / 1000).toFixed(2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatAge(iso: string) {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const totalMonths =
    (new Date(now).getFullYear() - new Date(created).getFullYear()) * 12 +
    (new Date(now).getMonth() - new Date(created).getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years !== 1 ? "s" : ""}`);
  if (months > 0 || years === 0) parts.push(`${months} mo${months !== 1 ? "s" : ""}`);
  return parts.join(", ");
}

export default async function SegmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isLoggedIn())) {
    redirect("/");
  }
  const { id } = await params;

  let segment: any = null;
  let efforts: any[] = [];
  let error: string | null = null;
  let effortsError: string | null = null;

  try {
    const res = await stravaFetch(`/segments/${id}`);
    if (res.status === 404) {
      error = "Segment not found.";
    } else if (!res.ok) {
      error = `Strava API error (${res.status}). Your app may still be in Single Player Mode — segments outside your own activities may not resolve until Strava approves broader access.`;
    } else {
      segment = await res.json();
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Unexpected error";
  }

  if (segment) {
    try {
      const res = await stravaFetch(`/segments/${id}/all_efforts?per_page=30`);
      if (res.ok) {
        efforts = await res.json();
      } else {
        effortsError = "Couldn't load your effort history for this segment.";
      }
    } catch {
      effortsError = "Couldn't load your effort history for this segment.";
    }
  }

  // Strava's segment object normally includes created_at directly. As a
  // fallback (e.g. if that field is ever missing), estimate a lower bound
  // from the earliest of your own recorded efforts on it.
  let earliestEffortDate: string | null = null;
  if (efforts.length > 0) {
    earliestEffortDate = efforts.reduce((earliest, ef) => {
      return !earliest || new Date(ef.start_date_local) < new Date(earliest)
        ? ef.start_date_local
        : earliest;
    }, null as string | null);
  }

  const confirmedCreatedAt: string | null = segment?.created_at || null;
  const showEstimate = !confirmedCreatedAt && Boolean(earliestEffortDate);

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <div className="brand">
            <span className="brand-mark" />
            Segcheck
          </div>
          <form action="/api/auth/logout" method="POST">
            <button className="btn btn-ghost" type="submit">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main>
        <div className="wrap" style={{ paddingTop: 48 }}>
          <nav className="nav-tabs">
            <a href="/dashboard">Segment lookup</a>
            <a href="/dashboard/stats">My stats</a>
          </nav>

          {error && <div className="error-banner">{error}</div>}

          {segment && (
            <>
              {(confirmedCreatedAt || showEstimate) && (
                <div className="card" style={{ borderColor: "var(--lime)" }}>
                  <p className="section-label" style={{ marginBottom: 6 }}>
                    Segment created
                  </p>
                  <h2 style={{ color: "var(--lime)" }}>
                    {formatDate((confirmedCreatedAt || earliestEffortDate) as string)}
                  </h2>
                  <div className="sub">
                    {confirmedCreatedAt
                      ? `${formatAge(confirmedCreatedAt)} ago`
                      : `At least ${formatAge(earliestEffortDate as string)} ago — estimated from the earliest of your own efforts on this segment, since a confirmed creation date wasn't returned. The real date could be earlier.`}
                  </div>
                </div>
              )}

              <div className="card">
                <h2>{segment.name}</h2>
                <div className="sub">
                  {segment.city ? `${segment.city}, ` : ""}
                  {segment.state ? `${segment.state}, ` : ""}
                  {segment.country || ""} · {segment.activity_type}
                </div>

                <div className="stat-grid">
                  <div className="stat">
                    <div className="label">Distance</div>
                    <div className="value lime">{km(segment.distance)} km</div>
                  </div>
                  <div className="stat">
                    <div className="label">Avg grade</div>
                    <div className="value">{segment.average_grade}%</div>
                  </div>
                  <div className="stat">
                    <div className="label">Max grade</div>
                    <div className="value">{segment.maximum_grade}%</div>
                  </div>
                  <div className="stat">
                    <div className="label">Elev. gain</div>
                    <div className="value">{Math.round(segment.total_elevation_gain)} m</div>
                  </div>
                  <div className="stat">
                    <div className="label">Efforts</div>
                    <div className="value">{segment.effort_count?.toLocaleString?.() ?? "—"}</div>
                  </div>
                  <div className="stat">
                    <div className="label">Athletes</div>
                    <div className="value">{segment.athlete_count?.toLocaleString?.() ?? "—"}</div>
                  </div>
                </div>

                {segment.xoms?.kom && (
                  <div className="created-badge" style={{ marginRight: 10 }}>
                    <span className="tag">KOM</span>
                    <span className="date">{segment.xoms.kom}</span>
                  </div>
                )}
                {segment.xoms?.qom && (
                  <div className="created-badge">
                    <span className="tag">QOM</span>
                    <span className="date">{segment.xoms.qom}</span>
                  </div>
                )}
              </div>

              <p className="section-label">Your effort history</p>
              <div className="card">
                {effortsError && <div className="error-banner">{effortsError}</div>}
                {!effortsError && efforts.length === 0 && (
                  <div className="empty">
                    No recorded efforts of yours on this segment yet — ride it and it&apos;ll show up here.
                  </div>
                )}
                {efforts.length > 0 && (
                  <table className="efforts">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Time</th>
                        <th>Avg watts</th>
                        <th>Avg HR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {efforts
                        .sort(
                          (a, b) =>
                            new Date(b.start_date_local).getTime() -
                            new Date(a.start_date_local).getTime()
                        )
                        .map((ef) => (
                          <tr key={ef.id}>
                            <td>{new Date(ef.start_date_local).toLocaleDateString()}</td>
                            <td style={{ fontFamily: "var(--font-body)" }}>{ef.name}</td>
                            <td>{formatDuration(ef.elapsed_time)}</td>
                            <td>{ef.average_watts ? Math.round(ef.average_watts) : "—"}</td>
                            <td>{ef.average_heartrate ? Math.round(ef.average_heartrate) : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
