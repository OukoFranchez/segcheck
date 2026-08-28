import { cookies } from "next/headers";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

const COOKIE_ACCESS = "strava_access_token";
const COOKIE_REFRESH = "strava_refresh_token";
const COOKIE_EXPIRES = "strava_expires_at";
export const COOKIE_OAUTH_STATE = "strava_oauth_state";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export function getAuthorizeUrl(redirectUri: string, state?: string) {
  const clientId = requireEnv("STRAVA_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "auto",
    scope: "read,activity:read_all,profile:read_all",
    ...(state ? { state } : {}),
  });
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: unknown;
};

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      refresh_token,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Cookie helpers ------------------------------------------------------------

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 90, // 90 days (refresh token lives long)
});

export async function setSessionCookies(tokens: TokenResponse) {
  try {
    const store = await cookies();
    const common = getCookieOptions();
    store.set(COOKIE_ACCESS, tokens.access_token, common);
    store.set(COOKIE_REFRESH, tokens.refresh_token, common);
    store.set(COOKIE_EXPIRES, String(tokens.expires_at), common);
  } catch {
    // In Server Components, cookies() is read-only.
    // Middleware handles refreshing and persisting cookies.
  }
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(COOKIE_ACCESS);
  store.delete(COOKIE_REFRESH);
  store.delete(COOKIE_EXPIRES);
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(COOKIE_REFRESH)?.value);
}

/**
 * Returns a valid access token, transparently refreshing it (and updating
 * cookies) if it has expired or is about to.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const store = await cookies();
  const access = store.get(COOKIE_ACCESS)?.value;
  const refresh = store.get(COOKIE_REFRESH)?.value;
  const expiresAt = Number(store.get(COOKIE_EXPIRES)?.value || 0);

  if (!refresh) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (access && expiresAt - nowSec > 60) {
    return access;
  }

  // Expired or about to expire - refresh it.
  const tokens = await refreshToken(refresh);
  await setSessionCookies(tokens);
  return tokens.access_token;
}

// In-memory TTL cache for static data (like segment metadata) ----------------
interface CacheItem {
  body: string;
  status: number;
  headers: Record<string, string>;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheItem>();

export async function stravaFetch(
  path: string,
  init?: RequestInit,
  options?: { ttlMs?: number }
): Promise<Response> {
  const isGet = !init?.method || init.method.toUpperCase() === "GET";
  // Default 1 hour cache for segment details (/segments/:id)
  const isSegmentMeta = /^\/segments\/\d+$/.test(path);
  const ttlMs = options?.ttlMs ?? (isSegmentMeta ? 60 * 60 * 1000 : 0);

  if (isGet && ttlMs > 0) {
    const cached = memoryCache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
    }
  }

  const token = await getValidAccessToken();
  if (!token) {
    throw new Error("NOT_AUTHENTICATED");
  }
  const res = await fetch(`${STRAVA_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (res.status === 429) {
    const usage = res.headers.get("x-ratelimit-usage") || "";
    const limit = res.headers.get("x-ratelimit-limit") || "";
    console.warn(`Strava Rate Limit Exceeded (429). Usage: [${usage}], Limit: [${limit}]`);
  }

  if (isGet && ttlMs > 0 && res.ok) {
    const cloned = res.clone();
    const body = await cloned.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      headers[key] = val;
    });

    if (memoryCache.size > 500) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }

    memoryCache.set(path, {
      body,
      status: res.status,
      headers,
      expiresAt: Date.now() + ttlMs,
    });
  }

  return res;
}

export function extractSegmentId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/segments\/(\d+)/);
  if (match) return match[1];
  return null;
}

export async function resolveSegmentId(input: string): Promise<string | null> {
  const directId = extractSegmentId(input);
  if (directId) return directId;

  let urlStr = input.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    return null;
  }

  // Prevent SSRF: only allow Strava domains
  const isStravaHost =
    parsedUrl.hostname === "strava.app.link" ||
    parsedUrl.hostname.endsWith(".strava.app.link") ||
    parsedUrl.hostname === "strava.com" ||
    parsedUrl.hostname.endsWith(".strava.com");

  if (!isStravaHost) {
    return null;
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // Check final redirected URL
    const finalUrlMatch = extractSegmentId(res.url);
    if (finalUrlMatch) return finalUrlMatch;

    // Check response body for canonical URL or segment links
    const html = await res.text();
    const htmlMatch = html.match(/segments\/(\d+)/);
    if (htmlMatch) return htmlMatch[1];
  } catch (err) {
    console.error("Failed to resolve short URL:", err);
  }

  return null;
}
