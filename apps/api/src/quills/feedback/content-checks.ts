// Automatic checks on customer text before it shows publicly (gaps G-22 and G-23). Each is a
// cheap rule set with no AI provider: a hit holds the post or comment for review, where a
// teammate approves or rejects it. shortcut: rules, not a model; add an AI check behind the
// assistant provider if the rules miss too much.

const LINK = /\bhttps?:\/\/|\bwww\.\S+\.\w{2,}/gi;
const SPAM_PHRASES =
  /\b(casino|viagra|cialis|porn|escort|crypto giveaway|free money|work from home|earn \$?\d+|click here|buy now|limited offer|payday loan|seo services|backlinks?)\b/i;

/** Signals of spam or abuse; two or more mark the text as spam. */
export function spamSignals(text: string): string[] {
  const signals: string[] = [];
  const letters = text.replace(/[^\p{L}]/gu, "");
  if ((text.match(LINK) ?? []).length >= 3) signals.push("links");
  if (SPAM_PHRASES.test(text)) signals.push("phrases");
  if (/(.)\1{7,}/u.test(text)) signals.push("repeated characters");
  if (
    letters.length >= 20 &&
    letters.replace(/[^\p{Lu}]/gu, "").length / letters.length > 0.7
  )
    signals.push("capitals");
  const words = text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  if (words.length >= 12 && new Set(words).size / words.length < 0.3)
    signals.push("repeated words");
  if (text.length >= 20 && letters.length / text.length < 0.3)
    signals.push("few letters");
  return signals;
}
export const looksLikeSpam = (text: string) => spamSignals(text).length >= 2;

/** A card number passes the Luhn check. */
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** The kinds of sensitive information found in the text, if any. */
export function sensitiveKinds(text: string): string[] {
  const kinds = new Set<string>();
  if (/[\w.+-]+@[\w-]+(\.[\w-]+)+/.test(text)) kinds.add("email");
  for (const match of text.match(/\b(?:\d[ -]?){13,19}\b/g) ?? []) {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits))
      kinds.add("card");
  }
  if (/(?:\+\d{1,3}[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/.test(text))
    kinds.add("phone");
  if (/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}\b/.test(text)) kinds.add("iban");
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) kinds.add("national id");
  if (
    /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}|\bxox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(
      text,
    )
  )
    kinds.add("secret");
  return [...kinds];
}
export const hasSensitive = (text: string) => sensitiveKinds(text).length > 0;
