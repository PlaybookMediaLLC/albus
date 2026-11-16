const KEY = "quills.list-width";
export const LIST_WIDTH = { min: 280, max: 520, initial: 360 } as const;

/** A list pane width in pixels, inside the allowed range. */
export const clampListWidth = (width: number) =>
  Math.round(Math.min(LIST_WIDTH.max, Math.max(LIST_WIDTH.min, width)));

/** The list pane width of this device. A blocked or bad value reads as the default. */
export function readListWidth() {
  try {
    const width = Number(window.localStorage.getItem(KEY));
    return width ? clampListWidth(width) : LIST_WIDTH.initial;
  } catch {
    return LIST_WIDTH.initial;
  }
}

export function writeListWidth(width: number) {
  try {
    window.localStorage.setItem(KEY, String(width));
  } catch {
    // ponytail: a blocked storage keeps the width for this page only.
  }
}
