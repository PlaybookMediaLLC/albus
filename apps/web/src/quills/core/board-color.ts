// Theme-token tones that read on the light and the dark theme. D1 of the Requests parity plan.
const tones = [
  "bg-info",
  "bg-chart-2",
  "bg-chart-1",
  "bg-success",
  "bg-chart-4",
  "bg-chart-3",
] as const;

/**
 * The dot color class of a board. The same board ID always gets the same tone.
 * ponytail: derived, not chosen; store a color in the board settings when teams ask to pick one.
 */
export function boardTone(boardId: string) {
  let hash = 0;
  for (const char of boardId) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return tones[Math.abs(hash) % tones.length]!;
}
