/**
 * The guided clarification steps (after Cossistant): the AI plans up to three questions when it
 * creates a suggestion; a teammate answers or skips them one by one; after the last one the
 * suggestion moves to "drafting" and the API asks the model for the final draft.
 */
import type { SuggestionStatus } from "./types.js";

/** The status of a new suggestion: with questions, wait for answers; without, draft at once. */
export const statusAfterPlanning = (questionCount: number): SuggestionStatus =>
  questionCount > 0 ? "awaiting_answer" : "drafting";

/** The step and status after one answer or skip. Throws when no question is open. */
export function afterTurn(state: {
  status: SuggestionStatus;
  stepIndex: number;
  questionCount: number;
}): { stepIndex: number; status: SuggestionStatus } {
  if (
    state.status !== "awaiting_answer" ||
    state.stepIndex >= state.questionCount
  )
    throw new Error("No question is waiting for an answer");
  const stepIndex = state.stepIndex + 1;
  return {
    stepIndex,
    status: stepIndex >= state.questionCount ? "drafting" : "awaiting_answer",
  };
}
