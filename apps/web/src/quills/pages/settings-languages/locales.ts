import type { EnableHelpCenterLocaleRequest } from "../../api/team/enable-help-center-locale";

export type HelpCenterLocale = EnableHelpCenterLocaleRequest["json"]["locale"];

/** The locales that `enableQuillsHelpCenterLocale` accepts, in the API order. */
export const helpCenterLocales = [
  "en",
  "de",
  "fr",
  "es",
  "ar",
  "ru",
  "pt-br",
  "zh-cn",
  "zh-tw",
  "nl",
  "pl",
  "th",
  "uk",
] as const satisfies readonly HelpCenterLocale[];

export const isHelpCenterLocale = (value: string): value is HelpCenterLocale =>
  (helpCenterLocales as readonly string[]).includes(value);

/** The name of a language in the display language, such as "Brazilian Portuguese". */
export function languageName(locale: string, display: string): string {
  try {
    return (
      new Intl.DisplayNames([display], { type: "language" }).of(locale) ??
      locale
    );
  } catch {
    return locale;
  }
}
