import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"][":entryId"]["translations"]
    .$get;
export type ListChangelogTranslationsRequest = InferRequestType<
  typeof endpoint
>;
export type ListChangelogTranslationsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listChangelogTranslationsKey = (
  input: ListChangelogTranslationsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listChangelogTranslations",
    input,
  );
export async function listChangelogTranslations(
  input: ListChangelogTranslationsRequest,
): Promise<ListChangelogTranslationsResponse> {
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
export const listChangelogTranslationsQuery = (
  input: ListChangelogTranslationsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListChangelogTranslationsResponse, PortalProblem>({
    queryKey: listChangelogTranslationsKey(input, viewer),
    queryFn: () => listChangelogTranslations(input),
  });
