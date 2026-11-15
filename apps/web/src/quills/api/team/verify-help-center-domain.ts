import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["domains"]["help-center"][
    "verify"
  ].$post;
export type VerifyHelpCenterDomainRequest = InferRequestType<typeof endpoint>;
export type VerifyHelpCenterDomainResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const verifyHelpCenterDomainKey = (
  input: VerifyHelpCenterDomainRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "verifyHelpCenterDomain",
    input,
  );
export async function verifyHelpCenterDomain(
  input: VerifyHelpCenterDomainRequest,
): Promise<VerifyHelpCenterDomainResponse> {
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
