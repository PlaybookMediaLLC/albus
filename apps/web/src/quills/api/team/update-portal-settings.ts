import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["portal"].$put;
export type UpdatePortalSettingsRequest = InferRequestType<typeof endpoint>;
export type UpdatePortalSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updatePortalSettingsKey = (
  input: UpdatePortalSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updatePortalSettings",
    input,
  );
export async function updatePortalSettings(
  input: UpdatePortalSettingsRequest,
): Promise<UpdatePortalSettingsResponse> {
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
