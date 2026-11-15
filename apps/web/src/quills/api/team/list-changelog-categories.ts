import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"]["categories"].$get;
export type ListChangelogCategoriesRequest = InferRequestType<typeof endpoint>;
export type ListChangelogCategoriesResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listChangelogCategoriesKey = (
  input: ListChangelogCategoriesRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listChangelogCategories",
    input,
  );
export async function listChangelogCategories(
  input: ListChangelogCategoriesRequest,
): Promise<ListChangelogCategoriesResponse> {
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
export const listChangelogCategoriesQuery = (
  input: ListChangelogCategoriesRequest,
  viewer: Viewer,
) =>
  queryOptions<ListChangelogCategoriesResponse, PortalProblem>({
    queryKey: listChangelogCategoriesKey(input, viewer),
    queryFn: () => listChangelogCategories(input),
  });
