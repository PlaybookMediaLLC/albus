import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["assistant"]["transform"].$post;
export type CreateAdminAssistantTransformRequest = InferRequestType<
  typeof endpoint
>;
export type CreateAdminAssistantTransformResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createAdminAssistantTransformKey = (
  input: CreateAdminAssistantTransformRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createAdminAssistantTransform",
    input,
  );
export async function createAdminAssistantTransform(
  input: CreateAdminAssistantTransformRequest,
): Promise<CreateAdminAssistantTransformResponse> {
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
