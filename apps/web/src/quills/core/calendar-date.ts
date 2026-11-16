/**
 * A calendar date such as "2026-10-12" in the viewer's language: "Oct 12", or "Oct 12, 2026"
 * with the year. The date has no time of day, so it is read in UTC and never shifts a day.
 */
export function calendarDate(day: string, locale: string, withYear = false) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(`${day.slice(0, 10)}T00:00:00Z`));
}
