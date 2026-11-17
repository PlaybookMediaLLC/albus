/** An update's date in the widget's language, or its preformatted `date`. */
export function updateDate(
  entry: { date: string; publishedAt?: string },
  locale?: string,
) {
  const date = entry.publishedAt ? new Date(entry.publishedAt) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString(locale, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : entry.date;
}

/** The date and time of a message in the widget's language. */
export function messageTime(value?: string, locale?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return {
    iso: date.toISOString(),
    day: date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}
