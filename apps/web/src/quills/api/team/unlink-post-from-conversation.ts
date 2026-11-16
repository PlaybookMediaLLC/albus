import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversations"][":conversationId"]["posts"][
    ":postId"
  ].$delete;
export type UnlinkPostFromConversationRequest = InferRequestType<
  typeof endpoint
>;
export type UnlinkPostFromConversationResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const unlinkPostFromConversationKey = (
  input: UnlinkPostFromConversationRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "unlinkPostFromConversation",
    input,
  );
export async function unlinkPostFromConversation(
  input: UnlinkPostFromConversationRequest,
): Promise<UnlinkPostFromConversationResponse> {
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
