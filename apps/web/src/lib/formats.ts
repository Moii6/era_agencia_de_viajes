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
