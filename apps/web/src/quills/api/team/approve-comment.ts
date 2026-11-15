import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["moderation"]["comments"][":commentId"][
    "approve"
  ].$post;
export type ApproveCommentRequest = InferRequestType<typeof endpoint>;
export type ApproveCommentResponse = InferResponseType<typeof endpoint, 200>;
export const approveCommentKey = (
  input: ApproveCommentRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "approveComment", input);
export async function approveComment(
  input: ApproveCommentRequest,
): Promise<ApproveCommentResponse> {
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
