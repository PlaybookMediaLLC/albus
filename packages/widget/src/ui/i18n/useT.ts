import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";
import { catalogs } from "./catalogs.js";
import { en, type MessageKey } from "./messages/en.js";
import type { Locale } from "./locales.js";
import { translate, type Vars } from "./translate.js";

const LocaleContext = createContext<Locale>("en");

/** The widget's language for everything below it. */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return createElement(LocaleContext.Provider, { value: locale }, children);
}

export type Translate = ((key: MessageKey, vars?: Vars) => string) & {
  /** An error's English message in the widget's language; other text as it is. */
  text: (message: string) => string;
};

// One function per language, so `t` is stable across renders and safe in effect dependencies.
const translators = new Map<Locale, Translate>();
function translator(locale: Locale): Translate {
  const known = translators.get(locale);
  if (known) return known;
  const t = (key: MessageKey, vars?: Vars) =>
    translate(locale, en[key], catalogs[locale][key], vars);
  const made = Object.assign(t, {
    text: (message: string) =>
      Object.prototype.hasOwnProperty.call(en, message)
        ? t(message as MessageKey)
        : message,
  });
  translators.set(locale, made);
  return made;
}

/** `t(key, vars)` in the widget's language; English for a message without a translation. */
export function useT(): Translate {
  return translator(useContext(LocaleContext));
}

/** The widget's language, for dates and numbers. */
export const useLocale = () => useContext(LocaleContext);
