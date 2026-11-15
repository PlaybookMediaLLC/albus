import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["tags"][":tagId"].$patch;
export type UpdateTagRequest = InferRequestType<typeof endpoint>;
export type UpdateTagResponse = InferResponseType<typeof endpoint, 200>;
export const updateTagKey = (input: UpdateTagRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "updateTag", input);
export async function updateTag(
  input: UpdateTagRequest,
): Promise<UpdateTagResponse> {
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
