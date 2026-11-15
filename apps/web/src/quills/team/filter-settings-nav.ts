import type { TeamNavSection } from "./nav";

/**
 * The settings sections that match a search (settings spec 1.3). An item matches by its
 * label; a section label match keeps all of its items. A section without a match goes.
 */
export function filterSettingsNav(
  sections: readonly TeamNavSection[],
  query: string,
  translate: (key: string) => string,
): readonly TeamNavSection[] {
  const words = query.trim().toLocaleLowerCase();
  if (!words) return sections;
  const matches = (key = "") =>
    translate(key).toLocaleLowerCase().includes(words);
  return sections.flatMap((section) => {
    const items = matches(section.labelKey)
      ? section.items
      : section.items.filter((item) => matches(item.labelKey));
    return items.length ? [{ ...section, items }] : [];
  });
}
