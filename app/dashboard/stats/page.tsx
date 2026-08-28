import { redirect } from "next/navigation";
import { isLoggedIn, stravaFetch } from "@/lib/strava";
import StatsCharts from "@/components/StatsCharts";

function km(meters: number) {
  return (meters / 1000).toFixed(1);
}

function hours(seconds: number) {
  return (seconds / 3600).toFixed(1);
}

export default async function StatsPage() {
  if (!(await isLoggedIn())) {
    redirect("/");
  }

  let athlete: any = null;
  let stats: any = null;
  let activities: any[] = [];
  let error: string | null = null;

  try {
    const athleteRes = await stravaFetch("/athlete");
    if (!athleteRes.ok) throw new Error(`Strava API error (${athleteRes.status})`);
    athlete = await athleteRes.json();

    const statsRes = await stravaFetch(`/athletes/${athlete.id}/stats`);
    if (statsRes.ok) stats = await statsRes.json();

    // Fetch a larger window for the trend charts; the table below only
    // shows the most recent handful.
    const actRes = await stravaFetch("/athlete/activities?per_page=60");
    if (actRes.ok) activities = await actRes.json();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unexpected error";
  }

  const ytd = stats?.ytd_ride_totals;
  const allTime = stats?.all_ride_totals;

  // Charts + table both focus on ride-type activities so a stray run or
  // swim doesn't skew elevation/HR trends for a cycling tool.
  const rides = activities.filter((a) => (a.type || "").toLowerCase().includes("ride"));
  const recentForTable = [...rides]
    .sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime())
    .slice(0, 8);


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
            <a href="/dashboard/stats" className="active">
              My stats
            </a>
          </nav>

          {error && <div className="error-banner">{error}</div>}

          {athlete && (
            <div className="card">
              <h2>
                {athlete.firstname} {athlete.lastname}
              </h2>
              <div className="sub">
                {athlete.city ? `${athlete.city}, ` : ""}
                {athlete.country || ""}
              </div>

              {ytd && (
                <>
                  <p className="section-label" style={{ marginTop: 8 }}>
                    This year
                  </p>
                  <div className="stat-grid" style={{ marginBottom: 20 }}>
                    <div className="stat">
                      <div className="label">Distance</div>
                      <div className="value lime">{km(ytd.distance)} km</div>
                    </div>
                    <div className="stat">
                      <div className="label">Rides</div>
                      <div className="value">{ytd.count}</div>
                    </div>
                    <div className="stat">
                      <div className="label">Moving time</div>
                      <div className="value">{hours(ytd.moving_time)} hrs</div>
                    </div>
                    <div className="stat">
                      <div className="label">Elev. gain</div>
                      <div className="value">{Math.round(ytd.elevation_gain)} m</div>
                    </div>
                  </div>
                </>
              )}

              {allTime && (
                <>
                  <p className="section-label">All time</p>
                  <div className="stat-grid">
                    <div className="stat">
                      <div className="label">Distance</div>
                      <div className="value lime">{km(allTime.distance)} km</div>
                    </div>
                    <div className="stat">
                      <div className="label">Rides</div>
                      <div className="value">{allTime.count}</div>
                    </div>
                    <div className="stat">
                      <div className="label">Moving time</div>
                      <div className="value">{hours(allTime.moving_time)} hrs</div>
                    </div>
                    <div className="stat">
                      <div className="label">Elev. gain</div>
                      <div className="value">{Math.round(allTime.elevation_gain)} m</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <p className="section-label">Recent activities</p>
          <div className="card">
            {recentForTable.length === 0 ? (
              <div className="empty">No recent rides found.</div>
            ) : (
              <table className="efforts">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Distance</th>
                    <th>Time</th>
                    <th>Elev.</th>
                  </tr>
                </thead>
                <tbody>
                  {recentForTable.map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.start_date_local).toLocaleDateString()}</td>
                      <td style={{ fontFamily: "var(--font-body)" }}>{a.name}</td>
                      <td>{km(a.distance)} km</td>
                      <td>{hours(a.moving_time)} hrs</td>
                      <td>{Math.round(a.total_elevation_gain)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {rides.length > 0 && <StatsCharts activities={rides} />}
        </div>
      </main>
    </>
  );
}
