import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["support"]["email-log"].$get;
export type ListRecentEmailLogRequest = InferRequestType<typeof endpoint>;
export type ListRecentEmailLogResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listRecentEmailLogKey = (
  input: ListRecentEmailLogRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listRecentEmailLog",
    input,
  );
export async function listRecentEmailLog(
  input: ListRecentEmailLogRequest,
): Promise<ListRecentEmailLogResponse> {
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
export const listRecentEmailLogQuery = (
  input: ListRecentEmailLogRequest,
  viewer: Viewer,
) =>
  queryOptions<ListRecentEmailLogResponse, PortalProblem>({
    queryKey: listRecentEmailLogKey(input, viewer),
    queryFn: () => listRecentEmailLog(input),
  });
