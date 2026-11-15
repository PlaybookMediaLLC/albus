import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["widget"].$get;
export type GetWidgetSettingsRequest = InferRequestType<typeof endpoint>;
export type GetWidgetSettingsResponse = InferResponseType<typeof endpoint, 200>;
export const getWidgetSettingsKey = (
  input: GetWidgetSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getWidgetSettings",
    input,
  );
export async function getWidgetSettings(
  input: GetWidgetSettingsRequest,
): Promise<GetWidgetSettingsResponse> {
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
export const getWidgetSettingsQuery = (
  input: GetWidgetSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetWidgetSettingsResponse, PortalProblem>({
    queryKey: getWidgetSettingsKey(input, viewer),
    queryFn: () => getWidgetSettings(input),
  });
