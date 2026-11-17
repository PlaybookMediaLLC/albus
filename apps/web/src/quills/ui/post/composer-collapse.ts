/**
 * True when focus left the composer and it holds nothing: no title and no details. A composer with
 * details stays open, for example while AI suggests a title for a customer who wrote only details.
 */
export function shouldCollapse(
  box: HTMLElement,
  next: EventTarget | null,
  title: string,
) {
  if ((next instanceof Node && box.contains(next)) || title.trim())
    return false;
  return !box.querySelector("textarea")?.value.trim();
}
