import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["portal"].$get;
export type GetPortalSettingsRequest = InferRequestType<typeof endpoint>;
export type GetPortalSettingsResponse = InferResponseType<typeof endpoint, 200>;
export const getPortalSettingsKey = (
  input: GetPortalSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getPortalSettings",
    input,
  );
export async function getPortalSettings(
  input: GetPortalSettingsRequest,
): Promise<GetPortalSettingsResponse> {
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
export const getPortalSettingsQuery = (
  input: GetPortalSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetPortalSettingsResponse, PortalProblem>({
    queryKey: getPortalSettingsKey(input, viewer),
    queryFn: () => getPortalSettings(input),
  });
