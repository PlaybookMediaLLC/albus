const DAY = 86_400_000;
const startOfDay = (time: number) => new Date(time).setHours(0, 0, 0, 0);

/**
 * The date of a list row: "now" under a minute, the time today, "Oct 31" this year and
 * "Oct 31, 2025" before. A future time counts as now.
 */
export function shortDate(iso: string, locale: string, now = Date.now()) {
  const time = Date.parse(iso);
  if (now - time < 60_000)
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      0,
      "second",
    );
  if (startOfDay(time) === startOfDay(now)) return clockTime(iso, locale);
  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear();
  return new Date(time).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

// Largest first: the first unit that fits the age names it.
const units = [
  { unit: "day", size: DAY },
  { unit: "hour", size: 3_600_000 },
  { unit: "minute", size: 60_000 },
] as const;

/**
 * The age of a conversation row: "now" under a minute, then "5m", "3h" and "6d", and the
 * date of `shortDate` from seven days.
 */
export function compactTime(iso: string, locale: string, now = Date.now()) {
  const age = now - Date.parse(iso);
  if (age < 60_000 || age >= 7 * DAY) return shortDate(iso, locale, now);
  const { unit, size } = units.find((item) => age >= item.size)!;
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "narrow",
  }).format(Math.floor(age / size));
}

// One formatter per locale: a long thread formats a time for every message on each render.
const clockFormats = new Map<string, Intl.DateTimeFormat>();

/** The time of day, such as "1:18 PM", for a message or an event. */
export function clockTime(iso: string, locale: string) {
  let format = clockFormats.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
    clockFormats.set(locale, format);
  }
  return format.format(new Date(iso));
}

/** The day of a thread separator: 0 is today, 1 is yesterday, else the long date. */
export function dayOf(iso: string, locale: string, now = Date.now()) {
  const days = Math.round(
    (startOfDay(now) - startOfDay(Date.parse(iso))) / DAY,
  );
  return {
    daysAgo: days,
    label: new Date(iso).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}
