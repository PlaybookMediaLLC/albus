import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["settings"]["portal"]["sign-in"].$put;
export type UpdatePortalSignInRequest = InferRequestType<typeof endpoint>;
export type UpdatePortalSignInResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const updatePortalSignInKey = (
  input: UpdatePortalSignInRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "updatePortalSignIn",
    input,
  );
export async function updatePortalSignIn(
  input: UpdatePortalSignInRequest,
): Promise<UpdatePortalSignInResponse> {
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
