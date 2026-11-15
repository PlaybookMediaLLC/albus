import type { InferRequestType, InferResponseType } from "hono/client";
import {
  infiniteQueryOptions,
  queryOptions,
  type InfiniteData,
} from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["users"][":principalId"]["comments"].$get;
export type ListUserCommentsRequest = InferRequestType<typeof endpoint>;
export type ListUserCommentsResponse = InferResponseType<typeof endpoint, 200>;
export const listUserCommentsKey = (
  input: ListUserCommentsRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listUserComments", input);
export async function listUserComments(
  input: ListUserCommentsRequest,
): Promise<ListUserCommentsResponse> {
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
export const listUserCommentsQuery = (
  input: ListUserCommentsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListUserCommentsResponse, PortalProblem>({
    queryKey: listUserCommentsKey(input, viewer),
    queryFn: () => listUserComments(input),
  });
export const listUserCommentsInfiniteQuery = (
  input: ListUserCommentsRequest,
  viewer: Viewer,
) =>
  infiniteQueryOptions<
    ListUserCommentsResponse,
    PortalProblem,
    InfiniteData<ListUserCommentsResponse>,
    ReturnType<typeof listUserCommentsKey>,
    string | undefined
  >({
    queryKey: listUserCommentsKey(input, viewer),
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      listUserComments({
        ...input,
        query: { ...input.query, cursor: pageParam },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
