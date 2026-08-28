/**
 * Format meters to kilometers with configurable decimals (default 2)
 */
export function formatKm(meters: number, decimals: number = 2): string {
  return (meters / 1000).toFixed(decimals);
}

/**
 * Format duration in seconds to M:SS or H:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format seconds to hours with 1 decimal place
 */
export function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(1);
}

/**
 * Format ISO date to long readable date (e.g. "January 15, 2024")
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format ISO date to short date (e.g. "Jan 15")
 */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format the age since an ISO date (e.g. "2 yrs, 4 mos")
 */
export function formatAge(iso: string): string {
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
