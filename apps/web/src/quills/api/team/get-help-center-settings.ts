import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["help-center"]["settings"].$get;
export type GetHelpCenterSettingsRequest = InferRequestType<typeof endpoint>;
export type GetHelpCenterSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getHelpCenterSettingsKey = (
  input: GetHelpCenterSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getHelpCenterSettings",
    input,
  );
export async function getHelpCenterSettings(
  input: GetHelpCenterSettingsRequest,
): Promise<GetHelpCenterSettingsResponse> {
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
export const getHelpCenterSettingsQuery = (
  input: GetHelpCenterSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetHelpCenterSettingsResponse, PortalProblem>({
    queryKey: getHelpCenterSettingsKey(input, viewer),
    queryFn: () => getHelpCenterSettings(input),
  });
