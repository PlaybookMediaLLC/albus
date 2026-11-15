import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["developer"].$get;
export type GetDeveloperSettingsRequest = InferRequestType<typeof endpoint>;
export type GetDeveloperSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getDeveloperSettingsKey = (
  input: GetDeveloperSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getDeveloperSettings",
    input,
  );
export async function getDeveloperSettings(
  input: GetDeveloperSettingsRequest,
): Promise<GetDeveloperSettingsResponse> {
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
export const getDeveloperSettingsQuery = (
  input: GetDeveloperSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetDeveloperSettingsResponse, PortalProblem>({
    queryKey: getDeveloperSettingsKey(input, viewer),
    queryFn: () => getDeveloperSettings(input),
  });
