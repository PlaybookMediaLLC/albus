import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["moderation"]["posts"][":postId"]["reject"]
    .$post;
export type RejectPostRequest = InferRequestType<typeof endpoint>;
export type RejectPostResponse = InferResponseType<typeof endpoint, 200>;
export const rejectPostKey = (input: RejectPostRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "rejectPost", input);
export async function rejectPost(
  input: RejectPostRequest,
): Promise<RejectPostResponse> {
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
