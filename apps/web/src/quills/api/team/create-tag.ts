import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["tags"].$post;
export type CreateTagRequest = InferRequestType<typeof endpoint>;
export type CreateTagResponse = InferResponseType<typeof endpoint, 200>;
export const createTagKey = (input: CreateTagRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "createTag", input);
export async function createTag(
  input: CreateTagRequest,
): Promise<CreateTagResponse> {
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
