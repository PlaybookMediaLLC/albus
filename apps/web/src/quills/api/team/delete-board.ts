import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["boards"][":boardId"].$delete;
export type DeleteBoardRequest = InferRequestType<typeof endpoint>;
export type DeleteBoardResponse = InferResponseType<typeof endpoint, 200>;
export const deleteBoardKey = (input: DeleteBoardRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "deleteBoard", input);
export async function deleteBoard(
  input: DeleteBoardRequest,
): Promise<DeleteBoardResponse> {
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
