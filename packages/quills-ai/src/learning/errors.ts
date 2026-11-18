/**
 * Typed failures of the learning module.
 *
 * Each kind is a bug or a misuse, never "no data": a store returns [] when nothing matches. None of
 * them gets better on a retry, so callers let them fail the job loudly.
 */
export const LEARNING_ERROR_KINDS = [
  "invalid_query",
  "dimension_mismatch",
  "invalid_example",
  "scope_mismatch",
] as const;
export type LearningErrorKind = (typeof LEARNING_ERROR_KINDS)[number];

export class LearningError extends Error {
  constructor(
    readonly kind: LearningErrorKind,
    detail?: string,
  ) {
    // The message names the kind and a count at most. It never holds customer text.
    super(detail ? `${kind}: ${detail}` : kind);
    this.name = "LearningError";
  }
}
