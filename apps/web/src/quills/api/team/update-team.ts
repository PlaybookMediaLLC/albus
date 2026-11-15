import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["teams"][":teamId"].$put;
export type UpdateTeamRequest = InferRequestType<typeof endpoint>;
export type UpdateTeamResponse = InferResponseType<typeof endpoint, 200>;
export const updateTeamKey = (input: UpdateTeamRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "updateTeam", input);
export async function updateTeam(
  input: UpdateTeamRequest,
): Promise<UpdateTeamResponse> {
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
