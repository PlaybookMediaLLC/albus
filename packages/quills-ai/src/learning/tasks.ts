/**
 * Per-task options. Only what differs from the SelectOptionsSchema defaults is here; the threshold
 * (0.78) and the character limits (500 per example, 3,000 per call) are the schema defaults in
 * types.ts. The threshold sits below the duplicate check's own candidate search (0.85), so examples
 * can be near the subject without being candidates. It is a starting value: tune it with the offline
 * replay in apps/api/scripts/ai-learning-eval (issue #275, section 16).
 */
import type { SelectOptions, TaskKind } from "./types.js";

export const TASKS = {
  duplicate: { k: 4, maxSameAnswer: 2 },
  tags: { k: 5 },
} as const satisfies Record<TaskKind, SelectOptions>;

/**
 * Each post of a duplicate pair, so that "first: " + side + "\nsecond: " + side (16 characters of
 * labels) stays within the 500-character example limit and selection never cuts the second post.
 */
export const PAIR_SIDE_CHARS = 242;
