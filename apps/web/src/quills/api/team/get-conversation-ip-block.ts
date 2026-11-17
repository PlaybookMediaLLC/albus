import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversations"][":conversationId"][
    "ip-block"
  ].$get;
export type GetConversationIpBlockRequest = InferRequestType<typeof endpoint>;
export type GetConversationIpBlockResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getConversationIpBlockKey = (
  input: GetConversationIpBlockRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getConversationIpBlock",
    input,
  );
export async function getConversationIpBlock(
  input: GetConversationIpBlockRequest,
): Promise<GetConversationIpBlockResponse> {
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
export const getConversationIpBlockQuery = (
  input: GetConversationIpBlockRequest,
  viewer: Viewer,
) =>
  queryOptions<GetConversationIpBlockResponse, PortalProblem>({
    queryKey: getConversationIpBlockKey(input, viewer),
    queryFn: () => getConversationIpBlock(input),
  });
