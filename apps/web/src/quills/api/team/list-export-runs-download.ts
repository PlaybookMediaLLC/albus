import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["transfer"]["export-runs"][":runId"][
    "download"
  ].$get;
export type ListExportRunsDownloadRequest = InferRequestType<typeof endpoint>;
export type ListExportRunsDownloadResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listExportRunsDownloadKey = (
  input: ListExportRunsDownloadRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listExportRunsDownload",
    input,
  );
export async function listExportRunsDownload(
  input: ListExportRunsDownloadRequest,
): Promise<ListExportRunsDownloadResponse> {
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
export const listExportRunsDownloadQuery = (
  input: ListExportRunsDownloadRequest,
  viewer: Viewer,
) =>
  queryOptions<ListExportRunsDownloadResponse, PortalProblem>({
    queryKey: listExportRunsDownloadKey(input, viewer),
    queryFn: () => listExportRunsDownload(input),
  });
