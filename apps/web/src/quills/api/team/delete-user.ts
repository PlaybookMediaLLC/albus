import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["users"][":principalId"].$delete;
export type DeleteUserRequest = InferRequestType<typeof endpoint>;
export type DeleteUserResponse = InferResponseType<typeof endpoint, 200>;
export const deleteUserKey = (input: DeleteUserRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "deleteUser", input);
export async function deleteUser(
  input: DeleteUserRequest,
): Promise<DeleteUserResponse> {
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
