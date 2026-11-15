import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["boards"].$post;
export type CreateBoardRequest = InferRequestType<typeof endpoint>;
export type CreateBoardResponse = InferResponseType<typeof endpoint, 200>;
export const createBoardKey = (input: CreateBoardRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "createBoard", input);
export async function createBoard(
  input: CreateBoardRequest,
): Promise<CreateBoardResponse> {
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
