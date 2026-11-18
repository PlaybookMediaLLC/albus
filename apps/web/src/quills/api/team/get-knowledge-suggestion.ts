import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["assistant"]["knowledge-suggestions"][
    ":suggestionId"
  ].$get;
export type GetKnowledgeSuggestionRequest = InferRequestType<typeof endpoint>;
export type GetKnowledgeSuggestionResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getKnowledgeSuggestionKey = (
  input: GetKnowledgeSuggestionRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getKnowledgeSuggestion",
    input,
  );
export async function getKnowledgeSuggestion(
  input: GetKnowledgeSuggestionRequest,
): Promise<GetKnowledgeSuggestionResponse> {
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
export const getKnowledgeSuggestionQuery = (
  input: GetKnowledgeSuggestionRequest,
  viewer: Viewer,
) =>
  queryOptions<GetKnowledgeSuggestionResponse, PortalProblem>({
    queryKey: getKnowledgeSuggestionKey(input, viewer),
    queryFn: () => getKnowledgeSuggestion(input),
  });
