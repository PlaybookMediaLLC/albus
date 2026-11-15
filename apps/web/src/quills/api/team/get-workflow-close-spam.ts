import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["automation"]["settings"]["close-spam"].$get;
export type GetWorkflowCloseSpamRequest = InferRequestType<typeof endpoint>;
export type GetWorkflowCloseSpamResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getWorkflowCloseSpamKey = (
  input: GetWorkflowCloseSpamRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getWorkflowCloseSpam",
    input,
  );
export async function getWorkflowCloseSpam(
  input: GetWorkflowCloseSpamRequest,
): Promise<GetWorkflowCloseSpamResponse> {
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
export const getWorkflowCloseSpamQuery = (
  input: GetWorkflowCloseSpamRequest,
  viewer: Viewer,
) =>
  queryOptions<GetWorkflowCloseSpamResponse, PortalProblem>({
    queryKey: getWorkflowCloseSpamKey(input, viewer),
    queryFn: () => getWorkflowCloseSpam(input),
  });
