import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["assistant"]["settings"].$get;
export type GetAssistantSettingsRequest = InferRequestType<typeof endpoint>;
export type GetAssistantSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getAssistantSettingsKey = (
  input: GetAssistantSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getAssistantSettings",
    input,
  );
export async function getAssistantSettings(
  input: GetAssistantSettingsRequest,
): Promise<GetAssistantSettingsResponse> {
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
export const getAssistantSettingsQuery = (
  input: GetAssistantSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetAssistantSettingsResponse, PortalProblem>({
    queryKey: getAssistantSettingsKey(input, viewer),
    queryFn: () => getAssistantSettings(input),
  });
