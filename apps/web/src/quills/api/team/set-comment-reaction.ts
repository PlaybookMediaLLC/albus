import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["comments"][":commentId"]["reactions"].$put;
export type SetCommentReactionRequest = InferRequestType<typeof endpoint>;
export type SetCommentReactionResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setCommentReactionKey = (
  input: SetCommentReactionRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setCommentReaction",
    input,
  );
export async function setCommentReaction(
  input: SetCommentReactionRequest,
): Promise<SetCommentReactionResponse> {
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
