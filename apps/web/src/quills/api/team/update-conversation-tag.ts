import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["conversation-tags"][":tagId"].$patch;
export type UpdateConversationTagRequest = InferRequestType<typeof endpoint>;
export type UpdateConversationTagResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateConversationTagKey = (
  input: UpdateConversationTagRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateConversationTag",
    input,
  );
export async function updateConversationTag(
  input: UpdateConversationTagRequest,
): Promise<UpdateConversationTagResponse> {
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
