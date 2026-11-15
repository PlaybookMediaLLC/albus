import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["changelog"][":entryId"].$get;
export type GetChangelogEntryRequest = InferRequestType<typeof endpoint>;
export type GetChangelogEntryResponse = InferResponseType<typeof endpoint, 200>;
export const getChangelogEntryKey = (
  input: GetChangelogEntryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getChangelogEntry",
    input,
  );
export async function getChangelogEntry(
  input: GetChangelogEntryRequest,
): Promise<GetChangelogEntryResponse> {
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
export const getChangelogEntryQuery = (
  input: GetChangelogEntryRequest,
  viewer: Viewer,
) =>
  queryOptions<GetChangelogEntryResponse, PortalProblem>({
    queryKey: getChangelogEntryKey(input, viewer),
    queryFn: () => getChangelogEntry(input),
  });
