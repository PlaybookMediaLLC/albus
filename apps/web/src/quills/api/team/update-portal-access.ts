import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["settings"]["portal"]["access"].$put;
export type UpdatePortalAccessRequest = InferRequestType<typeof endpoint>;
export type UpdatePortalAccessResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updatePortalAccessKey = (
  input: UpdatePortalAccessRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updatePortalAccess",
    input,
  );
export async function updatePortalAccess(
  input: UpdatePortalAccessRequest,
): Promise<UpdatePortalAccessResponse> {
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
