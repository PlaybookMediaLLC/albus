/**
 * Replaces personal and one-off details with placeholders before text reaches a prompt or a draft:
 * e-mail addresses, links, phone numbers and long digit runs (order, invoice and account numbers).
 * ponytail: patterns, not named-entity recognition; a name in plain text stays. The extract prompt
 * also tells the model to remove names.
 */
const RULES: [RegExp, string][] = [
  // Bounded to the RFC 5321 lengths: an unbounded local part is quadratic on a long run without "@".
  [/[\w.+-]{1,64}@[\w-]{1,63}(?:\.[\w-]{1,63})+/g, "[email]"],
  [/\bhttps?:\/\/\S+|\bwww\.\S+/gi, "[link]"],
  [/\+?\d[\d\s().-]{7,}\d/g, "[phone]"],
  [/\b\d{6,}\b/g, "[number]"],
];

export function redact(text: string): string {
  return RULES.reduce(
    (out, [pattern, label]) => out.replace(pattern, label),
    text,
  );
}
