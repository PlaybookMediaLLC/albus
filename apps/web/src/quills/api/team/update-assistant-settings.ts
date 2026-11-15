import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["assistant"]["settings"].$patch;
export type UpdateAssistantSettingsRequest = InferRequestType<typeof endpoint>;
export type UpdateAssistantSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateAssistantSettingsKey = (
  input: UpdateAssistantSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateAssistantSettings",
    input,
  );
export async function updateAssistantSettings(
  input: UpdateAssistantSettingsRequest,
): Promise<UpdateAssistantSettingsResponse> {
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
