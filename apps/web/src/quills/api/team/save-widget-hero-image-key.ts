import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["settings"]["widget"]["hero-image"].$put;
export type SaveWidgetHeroImageKeyRequest = InferRequestType<typeof endpoint>;
export type SaveWidgetHeroImageKeyResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const saveWidgetHeroImageKeyKey = (
  input: SaveWidgetHeroImageKeyRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "saveWidgetHeroImageKey",
    input,
  );
export async function saveWidgetHeroImageKey(
  input: SaveWidgetHeroImageKeyRequest,
): Promise<SaveWidgetHeroImageKeyResponse> {
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
