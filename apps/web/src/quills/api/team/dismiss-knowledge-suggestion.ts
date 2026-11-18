import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["assistant"]["knowledge-suggestions"][
    ":suggestionId"
  ]["dismiss"].$post;
export type DismissKnowledgeSuggestionRequest = InferRequestType<
  typeof endpoint
>;
export type DismissKnowledgeSuggestionResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const dismissKnowledgeSuggestionKey = (
  input: DismissKnowledgeSuggestionRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "dismissKnowledgeSuggestion",
    input,
  );
export async function dismissKnowledgeSuggestion(
  input: DismissKnowledgeSuggestionRequest,
): Promise<DismissKnowledgeSuggestionResponse> {
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
