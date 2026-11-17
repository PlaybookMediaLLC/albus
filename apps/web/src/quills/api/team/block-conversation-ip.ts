import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversations"][":conversationId"][
    "ip-block"
  ].$put;
export type BlockConversationIpRequest = InferRequestType<typeof endpoint>;
export type BlockConversationIpResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const blockConversationIpKey = (
  input: BlockConversationIpRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "blockConversationIp",
    input,
  );
export async function blockConversationIp(
  input: BlockConversationIpRequest,
): Promise<BlockConversationIpResponse> {
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
