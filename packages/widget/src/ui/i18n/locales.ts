/** The languages of the widget's own copy; the SDK README lists the same set. */
export const LOCALES = [
  "en",
  "fr",
  "de",
  "es",
  "ar",
  "ru",
  "pt-BR",
  "zh-CN",
  "zh-TW",
  "nl",
  "pl",
  "th",
  "uk",
] as const;
export type Locale = (typeof LOCALES)[number];

/** A supported locale for a BCP-47 tag, else English. The same rules as the API's normalizeLocale. */
export function widgetLocale(tag: string | null | undefined): Locale {
  const lower = (tag ?? "").trim().toLowerCase();
  const exact = LOCALES.find((locale) => locale.toLowerCase() === lower);
  if (exact) return exact;
  const [base] = lower.split("-");
  if (base === "zh") {
    try {
      return new Intl.Locale(lower).maximize().script === "Hant"
        ? "zh-TW"
        : "zh-CN";
    } catch {
      return "zh-CN";
    }
  }
  if (base === "pt") return "pt-BR";
  return LOCALES.find((locale) => locale === base) ?? "en";
}

/** Right-to-left scripts among the supported locales. */
export const isRtl = (locale: Locale) => locale === "ar";
