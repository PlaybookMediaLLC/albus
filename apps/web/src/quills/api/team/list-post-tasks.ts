import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["tasks"].$get;
export type ListPostTasksRequest = InferRequestType<typeof endpoint>;
export type ListPostTasksResponse = InferResponseType<typeof endpoint, 200>;
export const listPostTasksKey = (input: ListPostTasksRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listPostTasks", input);
export async function listPostTasks(
  input: ListPostTasksRequest,
): Promise<ListPostTasksResponse> {
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
export const listPostTasksQuery = (
  input: ListPostTasksRequest,
  viewer: Viewer,
) =>
  queryOptions<ListPostTasksResponse, PortalProblem>({
    queryKey: listPostTasksKey(input, viewer),
    queryFn: () => listPostTasks(input),
  });
