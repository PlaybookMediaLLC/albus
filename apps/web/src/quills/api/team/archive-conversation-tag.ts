import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversation-tags"][":tagId"].$delete;
export type ArchiveConversationTagRequest = InferRequestType<typeof endpoint>;
export type ArchiveConversationTagResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const archiveConversationTagKey = (
  input: ArchiveConversationTagRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "archiveConversationTag",
    input,
  );
export async function archiveConversationTag(
  input: ArchiveConversationTagRequest,
): Promise<ArchiveConversationTagResponse> {
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
