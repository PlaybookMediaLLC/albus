import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["developer"].$put;
export type UpdateDeveloperSettingsRequest = InferRequestType<typeof endpoint>;
export type UpdateDeveloperSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateDeveloperSettingsKey = (
  input: UpdateDeveloperSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateDeveloperSettings",
    input,
  );
export async function updateDeveloperSettings(
  input: UpdateDeveloperSettingsRequest,
): Promise<UpdateDeveloperSettingsResponse> {
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
