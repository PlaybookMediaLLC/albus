import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["transfer"]["export-runs"].$get;
export type ListExportRunsRequest = InferRequestType<typeof endpoint>;
export type ListExportRunsResponse = InferResponseType<typeof endpoint, 200>;
export const listExportRunsKey = (
  input: ListExportRunsRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listExportRuns", input);
export async function listExportRuns(
  input: ListExportRunsRequest,
): Promise<ListExportRunsResponse> {
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
export const listExportRunsQuery = (
  input: ListExportRunsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListExportRunsResponse, PortalProblem>({
    queryKey: listExportRunsKey(input, viewer),
    queryFn: () => listExportRuns(input),
  });
