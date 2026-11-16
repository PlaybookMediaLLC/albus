import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["post-views"].$post;
export type CreatePostViewRequest = InferRequestType<typeof endpoint>;
export type CreatePostViewResponse = InferResponseType<typeof endpoint, 200>;
export const createPostViewKey = (
  input: CreatePostViewRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "createPostView", input);
export async function createPostView(
  input: CreatePostViewRequest,
): Promise<CreatePostViewResponse> {
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
