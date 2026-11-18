/** Cuts text to at most `max` characters at a word boundary, and adds "…" when it cut. */
export function clip(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const limit = Math.max(1, max - 1);
  const slice = trimmed.slice(0, limit);
  const space = slice.lastIndexOf(" ");
  // Keep the slice when it already ends a word. A single long word has no usable space: cut
  // inside it rather than return almost nothing.
  const cut = /\s/.test(trimmed[limit] ?? "")
    ? slice
    : space > max / 2
      ? slice.slice(0, space)
      : slice;
  return `${cut.trimEnd()}…`;
}
