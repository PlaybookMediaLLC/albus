import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["automation"]["settings"][
    "abandoned-auto-close"
  ].$get;
export type GetWorkflowAbandonedAutoCloseRequest = InferRequestType<
  typeof endpoint
>;
export type GetWorkflowAbandonedAutoCloseResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getWorkflowAbandonedAutoCloseKey = (
  input: GetWorkflowAbandonedAutoCloseRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getWorkflowAbandonedAutoClose",
    input,
  );
export async function getWorkflowAbandonedAutoClose(
  input: GetWorkflowAbandonedAutoCloseRequest,
): Promise<GetWorkflowAbandonedAutoCloseResponse> {
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
export const getWorkflowAbandonedAutoCloseQuery = (
  input: GetWorkflowAbandonedAutoCloseRequest,
  viewer: Viewer,
) =>
  queryOptions<GetWorkflowAbandonedAutoCloseResponse, PortalProblem>({
    queryKey: getWorkflowAbandonedAutoCloseKey(input, viewer),
    queryFn: () => getWorkflowAbandonedAutoClose(input),
  });
