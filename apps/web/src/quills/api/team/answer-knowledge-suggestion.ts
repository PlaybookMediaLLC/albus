import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["assistant"]["knowledge-suggestions"][
    ":suggestionId"
  ]["answer"].$post;
export type AnswerKnowledgeSuggestionRequest = InferRequestType<
  typeof endpoint
>;
export type AnswerKnowledgeSuggestionResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const answerKnowledgeSuggestionKey = (
  input: AnswerKnowledgeSuggestionRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "answerKnowledgeSuggestion",
    input,
  );
export async function answerKnowledgeSuggestion(
  input: AnswerKnowledgeSuggestionRequest,
): Promise<AnswerKnowledgeSuggestionResponse> {
  try {
    const response = await endpoint(input);
    if (!response.ok) throw await toPortalProblem(response, "teammate", false);
    return response.json();
  } catch (error) {
    if (typeof error === "object" && error !== null && "kind" in error)
      throw error;
    throw networkPortalProblem();
  }
}
