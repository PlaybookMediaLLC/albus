import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["automation"]["settings"][
    "abandoned-auto-close"
  ].$put;
export type SetWorkflowAbandonedAutoCloseRequest = InferRequestType<
  typeof endpoint
>;
export type SetWorkflowAbandonedAutoCloseResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setWorkflowAbandonedAutoCloseKey = (
  input: SetWorkflowAbandonedAutoCloseRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setWorkflowAbandonedAutoClose",
    input,
  );
export async function setWorkflowAbandonedAutoClose(
  input: SetWorkflowAbandonedAutoCloseRequest,
): Promise<SetWorkflowAbandonedAutoCloseResponse> {
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
