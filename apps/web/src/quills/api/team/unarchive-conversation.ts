import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversations"][":conversationId"][
    "unarchive"
  ].$post;
export type UnarchiveConversationRequest = InferRequestType<typeof endpoint>;
export type UnarchiveConversationResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const unarchiveConversationKey = (
  input: UnarchiveConversationRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "unarchiveConversation",
    input,
  );
export async function unarchiveConversation(
  input: UnarchiveConversationRequest,
): Promise<UnarchiveConversationResponse> {
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
