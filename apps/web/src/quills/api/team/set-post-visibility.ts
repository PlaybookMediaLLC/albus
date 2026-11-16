import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["visibility"].$put;
export type SetPostVisibilityRequest = InferRequestType<typeof endpoint>;
export type SetPostVisibilityResponse = InferResponseType<typeof endpoint, 200>;
export const setPostVisibilityKey = (
  input: SetPostVisibilityRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setPostVisibility",
    input,
  );
export async function setPostVisibility(
  input: SetPostVisibilityRequest,
): Promise<SetPostVisibilityResponse> {
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
