import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["branding"].$put;
export type UpdateBrandingSettingsRequest = InferRequestType<typeof endpoint>;
export type UpdateBrandingSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateBrandingSettingsKey = (
  input: UpdateBrandingSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateBrandingSettings",
    input,
  );
export async function updateBrandingSettings(
  input: UpdateBrandingSettingsRequest,
): Promise<UpdateBrandingSettingsResponse> {
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
