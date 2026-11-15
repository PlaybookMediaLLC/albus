import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversation-tags"]["usage"].$get;
export type ListConversationTagUsageRequest = InferRequestType<typeof endpoint>;
export type ListConversationTagUsageResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listConversationTagUsageKey = (
  input: ListConversationTagUsageRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listConversationTagUsage",
    input,
  );
export async function listConversationTagUsage(
  input: ListConversationTagUsageRequest,
): Promise<ListConversationTagUsageResponse> {
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
export const listConversationTagUsageQuery = (
  input: ListConversationTagUsageRequest,
  viewer: Viewer,
) =>
  queryOptions<ListConversationTagUsageResponse, PortalProblem>({
    queryKey: listConversationTagUsageKey(input, viewer),
    queryFn: () => listConversationTagUsage(input),
  });
