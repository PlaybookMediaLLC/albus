import type { Locale } from "./locales.js";

/** A message, or its plural forms by Intl.PluralRules category; `other` is required. */
export type Message =
  | string
  | ({ other: string } & Partial<Record<Intl.LDMLPluralRule, string>>);
export type Vars = Record<string, string | number>;

/**
 * The message in the catalog, else the English source, with `{name}` replaced by its value.
 * A plural message picks its form by `vars.count`.
 */
export function translate(
  locale: Locale,
  source: Message,
  translated: Message | undefined,
  vars: Vars = {},
): string {
  const message = translated ?? source;
  const text =
    typeof message === "string"
      ? message
      : (message[
          new Intl.PluralRules(locale).select(Number(vars.count ?? 0))
        ] ?? message.other);
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
