import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["restore"].$post;
export type RestorePostRequest = InferRequestType<typeof endpoint>;
export type RestorePostResponse = InferResponseType<typeof endpoint, 200>;
export const restorePostKey = (input: RestorePostRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "restorePost", input);
export async function restorePost(
  input: RestorePostRequest,
): Promise<RestorePostResponse> {
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
