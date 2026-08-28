import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/strava";
import SegmentSearch from "@/components/SegmentSearch";

export default async function Dashboard() {
  if (!(await isLoggedIn())) {
    redirect("/");
  }

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
            <a href="/dashboard" className="active">
              Segment lookup
            </a>
            <a href="/dashboard/stats">My stats</a>
          </nav>

          <p className="section-label">Segment lookup</p>
          <SegmentSearch />

          <div className="card">
            <div className="sub">
              Paste any Strava segment link (including a short strava.app.link invite) or
              just the numeric segment ID. You&apos;ll get full segment details, its
              creation date, and your effort history on it.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
