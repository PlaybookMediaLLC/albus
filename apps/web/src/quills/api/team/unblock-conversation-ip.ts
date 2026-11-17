import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversations"][":conversationId"][
    "ip-block"
  ].$delete;
export type UnblockConversationIpRequest = InferRequestType<typeof endpoint>;
export type UnblockConversationIpResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const unblockConversationIpKey = (
  input: UnblockConversationIpRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "unblockConversationIp",
    input,
  );
export async function unblockConversationIp(
  input: UnblockConversationIpRequest,
): Promise<UnblockConversationIpResponse> {
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
