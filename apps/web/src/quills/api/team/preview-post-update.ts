import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["posts"][":postId"]["updates"]["preview"]
    .$post;
export type PreviewPostUpdateRequest = InferRequestType<typeof endpoint>;
export type PreviewPostUpdateResponse = InferResponseType<typeof endpoint, 200>;
export const previewPostUpdateKey = (
  input: PreviewPostUpdateRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "previewPostUpdate",
    input,
  );
export async function previewPostUpdate(
  input: PreviewPostUpdateRequest,
): Promise<PreviewPostUpdateResponse> {
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
