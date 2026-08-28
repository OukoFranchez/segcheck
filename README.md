# Segcheck — Strava Segment Explorer

A small Next.js app: log in with Strava, look up any segment's full details and
creation date, browse your effort history on it, and see your overall ride stats.

## 1. Create a Strava API application

1. Go to https://www.strava.com/settings/api (log in first).
2. Fill in the form. For local dev, set:
   - **Authorization Callback Domain:** `localhost`
3. Save — you'll get a **Client ID** and **Client Secret**.

Note: new Strava API apps start in **"Single Player Mode"** — only the app
creator's own account returns data until Strava manually approves the app for
public/multi-user access. Anyone can still log in via OAuth; their tokens just
won't return data until you request elevated access from Strava
(Settings → API → request "release" of your app).

## 2. Run locally

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and paste in your Client ID / Secret
npm run dev
```

Visit http://localhost:3000, click "Connect with Strava".

## 3. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo.
3. Add environment variables in Vercel's project settings:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
4. Deploy.
5. Back in your Strava API application settings
   (https://www.strava.com/settings/api), update **Authorization Callback
   Domain** to your Vercel domain (e.g. `your-app.vercel.app`) — Strava only
   allows one callback domain at a time, so switch it when you move from
   local dev to production.

## What it does

- **OAuth login** — multi-user, tokens stored in httpOnly cookies (no
  database needed for this scale; refresh tokens auto-refresh access tokens).
- **Segment lookup** (`/segment/[id]`) — paste a segment URL, invite link
  slug, or numeric ID. Shows distance, grade, elevation, KOM/QOM, and the
  segment's `created_at` date straight from the Strava API.
- **Your effort history on a segment** — pulled via `/segments/{id}/all_efforts`.
- **My stats** (`/dashboard/stats`) — year-to-date and all-time ride totals,
  plus your most recent activities.

## Limitations

- Strava deprecated the general cross-athlete leaderboard endpoint for most
  API apps, so this shows *your own* efforts on a segment, not a full public
  leaderboard.
- Until your app is approved by Strava for broader access, segment/effort
  data will only resolve for the account that created the API application.
