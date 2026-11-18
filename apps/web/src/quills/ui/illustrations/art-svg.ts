/**
 * The shared attributes of an empty-state drawing: a 96×80 frame of 1.25px strokes in the muted
 * text colour, with the `art` motion utility. Decorative, so hidden from screen readers.
 */
export const artSvg = {
  viewBox: "0 0 96 80",
  width: 96,
  height: 80,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
  className: "art shrink-0 overflow-visible text-muted-foreground",
} as const;
