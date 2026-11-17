const unit = (locale: string, value: number, name: "year" | "day" | "hour") =>
  new Intl.NumberFormat(locale, {
    style: "unit",
    unit: name,
    unitDisplay: "narrow",
  }).format(value);

/** A short age such as "3d" in the locale's units; under an hour, `justNow`. */
export function relativeTime(
  value: string | undefined,
  locale = "en",
  justNow = "Just now",
) {
  if (!value) return undefined;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return undefined;
  const days = Math.max(0, Math.floor((Date.now() - time) / 86400000));
  if (days >= 365) return unit(locale, Math.floor(days / 365), "year");
  if (days >= 1) return unit(locale, days, "day");
  const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000));
  return hours ? unit(locale, hours, "hour") : justNow;
}
