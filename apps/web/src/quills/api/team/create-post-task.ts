import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["tasks"].$post;
export type CreatePostTaskRequest = InferRequestType<typeof endpoint>;
export type CreatePostTaskResponse = InferResponseType<typeof endpoint, 200>;
export const createPostTaskKey = (
  input: CreatePostTaskRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "createPostTask", input);
export async function createPostTask(
  input: CreatePostTaskRequest,
): Promise<CreatePostTaskResponse> {
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
