import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["updates"].$post;
export type SendPostUpdateRequest = InferRequestType<typeof endpoint>;
export type SendPostUpdateResponse = InferResponseType<typeof endpoint, 200>;
export const sendPostUpdateKey = (
  input: SendPostUpdateRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "sendPostUpdate", input);
export async function sendPostUpdate(
  input: SendPostUpdateRequest,
): Promise<SendPostUpdateResponse> {
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
