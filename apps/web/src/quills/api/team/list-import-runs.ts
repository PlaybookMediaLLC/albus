import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["transfer"]["import-runs"].$get;
export type ListImportRunsRequest = InferRequestType<typeof endpoint>;
export type ListImportRunsResponse = InferResponseType<typeof endpoint, 200>;
export const listImportRunsKey = (
  input: ListImportRunsRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listImportRuns", input);
export async function listImportRuns(
  input: ListImportRunsRequest,
): Promise<ListImportRunsResponse> {
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
export const listImportRunsQuery = (
  input: ListImportRunsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListImportRunsResponse, PortalProblem>({
    queryKey: listImportRunsKey(input, viewer),
    queryFn: () => listImportRuns(input),
  });
