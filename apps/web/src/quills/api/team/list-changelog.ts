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

const endpoint = client["quills"][":workspaceId"]["changelog"].$get;
export type ListChangelogRequest = InferRequestType<typeof endpoint>;
export type ListChangelogResponse = InferResponseType<typeof endpoint, 200>;
export const listChangelogKey = (input: ListChangelogRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listChangelog", input);
export async function listChangelog(
  input: ListChangelogRequest,
): Promise<ListChangelogResponse> {
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
export const listChangelogQuery = (
  input: ListChangelogRequest,
  viewer: Viewer,
) =>
  queryOptions<ListChangelogResponse, PortalProblem>({
    queryKey: listChangelogKey(input, viewer),
    queryFn: () => listChangelog(input),
  });
export const listChangelogInfiniteQuery = (
  input: ListChangelogRequest,
  viewer: Viewer,
) =>
  infiniteQueryOptions<
    ListChangelogResponse,
    PortalProblem,
    InfiniteData<ListChangelogResponse>,
    ReturnType<typeof listChangelogKey>,
    string | undefined
  >({
    queryKey: listChangelogKey(input, viewer),
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      listChangelog({ ...input, query: { ...input.query, cursor: pageParam } }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
