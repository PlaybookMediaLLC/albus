// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
// Protected terms for machine translation (issue #76): each term is swapped for a placeholder
// before the provider call and put back after it, so the provider never sees, and cannot change,
// the term. A translation that lost or doubled a placeholder is not used. Pure: no database.

const MAX_TERMS = 100;
const mark = (index: number) => `⟦${index}⟧`;

/** The terms that occur in `texts`, longest first, so a term inside another term never splits it. */
export function termsIn(terms: readonly string[], texts: readonly string[]) {
  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))]
    .filter((term) => texts.some((text) => text.includes(term)))
    .sort((a, b) => b.length - a.length)
    .slice(0, MAX_TERMS);
}

const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The text with each term replaced by its placeholder, in one pass so no term matches inside a placeholder. */
export const protect = (text: string, terms: readonly string[]) =>
  terms.length
    ? text.replace(new RegExp(terms.map(escape).join("|"), "g"), (term) =>
        mark(terms.indexOf(term)),
      )
    : text;

/**
 * The translation with each placeholder put back, or null when the provider dropped, added or
 * repeated one: then a protected term would be missing or changed.
 */
export function restore(
  source: string,
  translated: string,
  terms: readonly string[],
): string | null {
  let out = translated;
  for (const [index, term] of terms.entries()) {
    const placeholder = mark(index);
    const expected = source.split(placeholder).length - 1;
    if (translated.split(placeholder).length - 1 !== expected) return null;
    out = out.split(placeholder).join(term);
  }
  return /⟦\d+⟧/.test(out) ? null : out;
}
