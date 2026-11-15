import { copyToClipboard, toast } from "../../ui/upstream";

/** Text for an HTML snippet: `&`, `<`, `>` and quotes become entities. */
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

/**
 * Copies HTML with its plain text, so a mail editor pastes the formatted snippet. Without
 * the rich clipboard API (plain HTTP, older browsers) it copies the plain text.
 */
export async function copyRich(html: string, text: string) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    } catch {
      // Permission denied: fall back to plain text.
    }
  }
  return copyToClipboard(text);
}

/** Shows "Copied" or the copy failure after a copy. */
export async function tellCopy(
  copied: Promise<boolean>,
  t: (key: "settings.copied" | "settings.copyFailed") => string,
) {
  if (await copied) toast.success(t("settings.copied"));
  else toast.error(t("settings.copyFailed"));
}
