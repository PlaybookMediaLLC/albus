import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["automation"]["settings"]["close-spam"].$put;
export type SetWorkflowCloseSpamRequest = InferRequestType<typeof endpoint>;
export type SetWorkflowCloseSpamResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setWorkflowCloseSpamKey = (
  input: SetWorkflowCloseSpamRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setWorkflowCloseSpam",
    input,
  );
export async function setWorkflowCloseSpam(
  input: SetWorkflowCloseSpamRequest,
): Promise<SetWorkflowCloseSpamResponse> {
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
