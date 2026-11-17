// The language a portal reader reads in (issue #76): the language saved in the portal
// preferences, else the browser's. Pure: no React.

/** The saved language when there is one, else the browser language. */
export const readerLocale = (saved?: string | null) =>
  saved?.trim() || globalThis.navigator?.language || "en";

// shortcut: content is taken to be English, the only portal UI language today; compare with a
// workspace language setting when one exists.
/** True when the reader's language is English: then no text offers a translation. */
export const readsEnglish = (locale: string) => /^en(-|$)/i.test(locale);
