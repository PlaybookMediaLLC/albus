export const LIST_WIDTH = { min: 280, max: 520, initial: 360 } as const;
/** The localStorage key of the list pane width on this device. */
export const LIST_WIDTH_KEY = "quills.list-width";

/** A list pane width in pixels, inside the allowed range. */
export const clampListWidth = (width: number) =>
  Math.round(Math.min(LIST_WIDTH.max, Math.max(LIST_WIDTH.min, width)));

/** A stored width; a missing or bad value reads as the default. */
export const parseListWidth = (raw: unknown) =>
  typeof raw === "number" && Number.isFinite(raw)
    ? clampListWidth(raw)
    : LIST_WIDTH.initial;
