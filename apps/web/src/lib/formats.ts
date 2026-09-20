// Dates from the API are pure calendar dates (e.g. "2026-11-10T00:00:00.000Z")
// with no meaningful time-of-day. Formatting them with the viewer's local
// timezone can shift the displayed day backwards (UTC midnight renders as
// the previous evening west of UTC) — timeZone: "UTC" keeps the date as-is.
export function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  });
}

// Same UTC-calendar-date reasoning as formatDate, but returns a comparable
// timestamp (UTC midnight) instead of a display string — for "is this date
// today / in range" checks without the viewer's timezone shifting the day.
export function toUTCDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function todayUTCDateOnly() {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}
