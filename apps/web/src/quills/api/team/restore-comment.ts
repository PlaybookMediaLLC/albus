import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["comments"][":commentId"]["restore"].$post;
export type RestoreCommentRequest = InferRequestType<typeof endpoint>;
export type RestoreCommentResponse = InferResponseType<typeof endpoint, 200>;
export const restoreCommentKey = (
  input: RestoreCommentRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "restoreComment", input);
export async function restoreComment(
  input: RestoreCommentRequest,
): Promise<RestoreCommentResponse> {
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
