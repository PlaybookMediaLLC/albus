import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["statuses"]["order"].$put;
export type ReorderStatusesRequest = InferRequestType<typeof endpoint>;
export type ReorderStatusesResponse = InferResponseType<typeof endpoint, 200>;
export const reorderStatusesKey = (
  input: ReorderStatusesRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "reorderStatuses", input);
export async function reorderStatuses(
  input: ReorderStatusesRequest,
): Promise<ReorderStatusesResponse> {
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
