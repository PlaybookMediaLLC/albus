import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["changelog"]["settings"].$patch;
export type UpdateChangelogSettingsRequest = InferRequestType<typeof endpoint>;
export type UpdateChangelogSettingsResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateChangelogSettingsKey = (
  input: UpdateChangelogSettingsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateChangelogSettings",
    input,
  );
export async function updateChangelogSettings(
  input: UpdateChangelogSettingsRequest,
): Promise<UpdateChangelogSettingsResponse> {
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
