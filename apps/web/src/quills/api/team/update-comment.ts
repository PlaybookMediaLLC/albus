import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["comments"][":commentId"].$patch;
export type UpdateCommentRequest = InferRequestType<typeof endpoint>;
export type UpdateCommentResponse = InferResponseType<typeof endpoint, 200>;
export const updateCommentKey = (input: UpdateCommentRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "updateComment", input);
export async function updateComment(
  input: UpdateCommentRequest,
): Promise<UpdateCommentResponse> {
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
