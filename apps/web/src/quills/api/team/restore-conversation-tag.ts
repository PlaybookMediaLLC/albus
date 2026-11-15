import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversation-tags"][":tagId"]["restore"]
    .$post;
export type RestoreConversationTagRequest = InferRequestType<typeof endpoint>;
export type RestoreConversationTagResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const restoreConversationTagKey = (
  input: RestoreConversationTagRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "restoreConversationTag",
    input,
  );
export async function restoreConversationTag(
  input: RestoreConversationTagRequest,
): Promise<RestoreConversationTagResponse> {
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
