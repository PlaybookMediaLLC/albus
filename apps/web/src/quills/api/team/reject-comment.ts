import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["moderation"]["comments"][":commentId"][
    "reject"
  ].$post;
export type RejectCommentRequest = InferRequestType<typeof endpoint>;
export type RejectCommentResponse = InferResponseType<typeof endpoint, 200>;
export const rejectCommentKey = (input: RejectCommentRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "rejectComment", input);
export async function rejectComment(
  input: RejectCommentRequest,
): Promise<RejectCommentResponse> {
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
