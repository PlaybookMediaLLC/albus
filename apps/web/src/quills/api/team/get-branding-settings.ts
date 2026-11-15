import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["branding"].$get;
export type GetBrandingSettingsRequest = InferRequestType<typeof endpoint>;
export type GetBrandingSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getBrandingSettingsKey = (
  input: GetBrandingSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getBrandingSettings",
    input,
  );
export async function getBrandingSettings(
  input: GetBrandingSettingsRequest,
): Promise<GetBrandingSettingsResponse> {
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
export const getBrandingSettingsQuery = (
  input: GetBrandingSettingsRequest,
  viewer: Viewer,
) =>
  queryOptions<GetBrandingSettingsResponse, PortalProblem>({
    queryKey: getBrandingSettingsKey(input, viewer),
    queryFn: () => getBrandingSettings(input),
  });
