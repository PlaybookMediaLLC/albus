import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["files"]["uploads"].$post;
export type CreateUploadRequest = InferRequestType<typeof endpoint>;
export type CreateUploadResponse = InferResponseType<typeof endpoint, 200>;
export const createUploadKey = (input: CreateUploadRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "createUpload", input);
export async function createUpload(
  input: CreateUploadRequest,
): Promise<CreateUploadResponse> {
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
