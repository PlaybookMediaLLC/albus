import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["tags"][":tagId"].$delete;
export type DeleteTagRequest = InferRequestType<typeof endpoint>;
export type DeleteTagResponse = InferResponseType<typeof endpoint, 200>;
export const deleteTagKey = (input: DeleteTagRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "deleteTag", input);
export async function deleteTag(
  input: DeleteTagRequest,
): Promise<DeleteTagResponse> {
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
