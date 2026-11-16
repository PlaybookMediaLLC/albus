import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversations"][":conversationId"][
    "archive"
  ].$post;
export type ArchiveConversationRequest = InferRequestType<typeof endpoint>;
export type ArchiveConversationResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const archiveConversationKey = (
  input: ArchiveConversationRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "archiveConversation",
    input,
  );
export async function archiveConversation(
  input: ArchiveConversationRequest,
): Promise<ArchiveConversationResponse> {
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
