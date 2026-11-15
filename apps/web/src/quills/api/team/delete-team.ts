import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["teams"][":teamId"].$delete;
export type DeleteTeamRequest = InferRequestType<typeof endpoint>;
export type DeleteTeamResponse = InferResponseType<typeof endpoint, 200>;
export const deleteTeamKey = (input: DeleteTeamRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "deleteTeam", input);
export async function deleteTeam(
  input: DeleteTeamRequest,
): Promise<DeleteTeamResponse> {
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
