import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["pinned-comment"][
    ":commentId"
  ].$put;
export type SetCommentPinRequest = InferRequestType<typeof endpoint>;
export type SetCommentPinResponse = InferResponseType<typeof endpoint, 200>;
export const setCommentPinKey = (input: SetCommentPinRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setCommentPin", input);
export async function setCommentPin(
  input: SetCommentPinRequest,
): Promise<SetCommentPinResponse> {
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
