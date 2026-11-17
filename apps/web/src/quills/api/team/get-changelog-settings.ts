import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["changelog"]["settings"].$get;
export type GetChangelogSettingsRequest = InferRequestType<typeof endpoint>;
export type GetChangelogSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getChangelogSettingsKey = (
  input: GetChangelogSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getChangelogSettings",
    input,
  );
export async function getChangelogSettings(
  input: GetChangelogSettingsRequest,
): Promise<GetChangelogSettingsResponse> {
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
export const getChangelogSettingsQuery = (
  input: GetChangelogSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetChangelogSettingsResponse, PortalProblem>({
    queryKey: getChangelogSettingsKey(input, viewer),
    queryFn: () => getChangelogSettings(input),
  });
