import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["comments"][":commentId"].$delete;
export type DeleteCommentRequest = InferRequestType<typeof endpoint>;
export type DeleteCommentResponse = InferResponseType<typeof endpoint, 200>;
export const deleteCommentKey = (input: DeleteCommentRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "deleteComment", input);
export async function deleteComment(
  input: DeleteCommentRequest,
): Promise<DeleteCommentResponse> {
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
