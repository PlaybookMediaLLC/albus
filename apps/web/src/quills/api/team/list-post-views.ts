import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["post-views"].$get;
export type ListPostViewsRequest = InferRequestType<typeof endpoint>;
export type ListPostViewsResponse = InferResponseType<typeof endpoint, 200>;
export const listPostViewsKey = (input: ListPostViewsRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listPostViews", input);
export async function listPostViews(
  input: ListPostViewsRequest,
): Promise<ListPostViewsResponse> {
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
export const listPostViewsQuery = (
  input: ListPostViewsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListPostViewsResponse, PortalProblem>({
    queryKey: listPostViewsKey(input, viewer),
    queryFn: () => listPostViews(input),
  });
