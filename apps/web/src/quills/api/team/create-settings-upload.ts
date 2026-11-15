import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["files"]["settings-uploads"].$post;
export type CreateSettingsUploadRequest = InferRequestType<typeof endpoint>;
export type CreateSettingsUploadResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createSettingsUploadKey = (
  input: CreateSettingsUploadRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createSettingsUpload",
    input,
  );
export async function createSettingsUpload(
  input: CreateSettingsUploadRequest,
): Promise<CreateSettingsUploadResponse> {
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
