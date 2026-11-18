import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["assistant"]["knowledge-suggestions"].$get;
export type ListKnowledgeSuggestionsRequest = InferRequestType<typeof endpoint>;
export type ListKnowledgeSuggestionsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listKnowledgeSuggestionsKey = (
  input: ListKnowledgeSuggestionsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listKnowledgeSuggestions",
    input,
  );
export async function listKnowledgeSuggestions(
  input: ListKnowledgeSuggestionsRequest,
): Promise<ListKnowledgeSuggestionsResponse> {
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
export const listKnowledgeSuggestionsQuery = (
  input: ListKnowledgeSuggestionsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListKnowledgeSuggestionsResponse, PortalProblem>({
    queryKey: listKnowledgeSuggestionsKey(input, viewer),
    queryFn: () => listKnowledgeSuggestions(input),
  });
