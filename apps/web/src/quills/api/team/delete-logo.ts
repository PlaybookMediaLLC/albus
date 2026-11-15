import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["logo"].$delete;
export type DeleteLogoRequest = InferRequestType<typeof endpoint>;
export type DeleteLogoResponse = InferResponseType<typeof endpoint, 200>;
export const deleteLogoKey = (input: DeleteLogoRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "deleteLogo", input);
export async function deleteLogo(
  input: DeleteLogoRequest,
): Promise<DeleteLogoResponse> {
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
