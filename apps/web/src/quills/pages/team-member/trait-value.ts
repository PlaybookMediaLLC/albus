/** The types of a user attribute definition. */
export type TraitType = "string" | "number" | "boolean" | "date" | "currency";

/**
 * A stored attribute value as text for its definition type. The caller translates a
 * boolean. A value that does not fit its type shows as stored.
 */
export function traitText(
  value: string | number,
  type: TraitType | undefined,
  locale: string,
  currencyCode?: string | null,
): string {
  if (type === "date") {
    const time = Date.parse(String(value));
    // A date trait is stored as UTC midnight. In the local zone, west of UTC, it is the day before.
    return Number.isNaN(time)
      ? String(value)
      : new Date(time).toLocaleDateString(locale, {
          dateStyle: "medium",
          timeZone: "UTC",
        });
  }
  if (typeof value === "number" && type === "currency" && currencyCode)
    return value.toLocaleString(locale, {
      style: "currency",
      currency: currencyCode,
    });
  if (typeof value === "number") return value.toLocaleString(locale);
  return value;
}

/** The value that the trait dialog sends for its text field, or undefined when it does not fit. */
export function traitInput(
  text: string,
  type: TraitType,
): string | number | boolean | undefined {
  if (type === "boolean") return text === "true";
  const value = text.trim();
  if (!value) return undefined;
  if (type === "number" || type === "currency") {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }
  if (type === "date")
    return Number.isNaN(Date.parse(value))
      ? undefined
      : new Date(value).toISOString();
  return value.slice(0, 1000);
}
