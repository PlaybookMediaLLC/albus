import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["comments"][":commentId"]["reactions"]
    .$delete;
export type RemoveCommentReactionRequest = InferRequestType<typeof endpoint>;
export type RemoveCommentReactionResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const removeCommentReactionKey = (
  input: RemoveCommentReactionRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "removeCommentReaction",
    input,
  );
export async function removeCommentReaction(
  input: RemoveCommentReactionRequest,
): Promise<RemoveCommentReactionResponse> {
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
