import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/strava";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isLoggedIn()) {
    redirect("/dashboard");
  }
  const params = await searchParams;

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <div className="brand">
            <span className="brand-mark" />
            Segcheck
          </div>
        </div>
      </header>
      <main>
        <div className="wrap hero">
          {params.error && (
            <div className="error-banner">
              Login failed ({params.error}). Try again.
            </div>
          )}
          <h1>
            Know your <em>segments</em>.
          </h1>
          <p>
            Look up when a segment was created, its full stats, your effort history on it,
            and your overall ride numbers — all pulled live from your Strava account.
          </p>
          <a className="btn btn-primary" href="/api/auth/login">
            Connect with Strava
          </a>

          <svg className="elevation" viewBox="0 0 800 90" preserveAspectRatio="none">
            <polyline
              points="0,80 60,72 120,74 180,50 240,55 300,20 360,30 420,15 480,35 540,25 600,45 660,40 720,60 800,50"
              fill="none"
              stroke="#c8ff4d"
              strokeWidth="2"
            />
          </svg>
        </div>
      </main>
    </>
  );
}
