import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["spam-filter"].$patch;
export type UpdateSpamFilterConfigRequest = InferRequestType<typeof endpoint>;
export type UpdateSpamFilterConfigResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updateSpamFilterConfigKey = (
  input: UpdateSpamFilterConfigRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updateSpamFilterConfig",
    input,
  );
export async function updateSpamFilterConfig(
  input: UpdateSpamFilterConfigRequest,
): Promise<UpdateSpamFilterConfigResponse> {
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
