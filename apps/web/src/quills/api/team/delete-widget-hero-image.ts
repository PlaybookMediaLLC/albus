import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["settings"]["widget"]["hero-image"].$delete;
export type DeleteWidgetHeroImageRequest = InferRequestType<typeof endpoint>;
export type DeleteWidgetHeroImageResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const deleteWidgetHeroImageKey = (
  input: DeleteWidgetHeroImageRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "deleteWidgetHeroImage",
    input,
  );
export async function deleteWidgetHeroImage(
  input: DeleteWidgetHeroImageRequest,
): Promise<DeleteWidgetHeroImageResponse> {
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
