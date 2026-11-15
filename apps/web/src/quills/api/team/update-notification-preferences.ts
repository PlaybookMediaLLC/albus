import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["notification-preferences"].$patch;
export type UpdateNotificationPreferencesRequest = InferRequestType<
  typeof endpoint
>;
export type UpdateNotificationPreferencesResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateNotificationPreferencesKey = (
  input: UpdateNotificationPreferencesRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateNotificationPreferences",
    input,
  );
export async function updateNotificationPreferences(
  input: UpdateNotificationPreferencesRequest,
): Promise<UpdateNotificationPreferencesResponse> {
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
