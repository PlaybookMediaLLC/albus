import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["vote"].$put;
export type VotePostRequest = InferRequestType<typeof endpoint>;
export type VotePostResponse = InferResponseType<typeof endpoint, 200>;
export const votePostKey = (input: VotePostRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "votePost", input);
export async function votePost(
  input: VotePostRequest,
): Promise<VotePostResponse> {
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
