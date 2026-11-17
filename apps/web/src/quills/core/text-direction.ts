// The text direction of a language (issue #117). Pure: no React.

/** Languages that are written right to left by default. */
const RTL = new Set([
  "ar",
  "arc",
  "ckb",
  "dv",
  "fa",
  "he",
  "iw",
  "ks",
  "ps",
  "sd",
  "syr",
  "ug",
  "ur",
  "yi",
]);

/** "rtl" for a right-to-left language or an Arabic-script tag (ku-Arab), else "ltr". */
export const directionOf = (locale: string): "rtl" | "ltr" =>
  RTL.has(locale.toLowerCase().split(/[-_]/)[0]!) ||
  /[-_](arab|hebr|thaa|syrc)(?=[-_]|$)/i.test(locale)
    ? "rtl"
    : "ltr";
