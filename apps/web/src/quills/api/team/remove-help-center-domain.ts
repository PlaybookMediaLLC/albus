import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["domains"]["help-center"]
    .$delete;
export type RemoveHelpCenterDomainRequest = InferRequestType<typeof endpoint>;
export type RemoveHelpCenterDomainResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const removeHelpCenterDomainKey = (
  input: RemoveHelpCenterDomainRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "removeHelpCenterDomain",
    input,
  );
export async function removeHelpCenterDomain(
  input: RemoveHelpCenterDomainRequest,
): Promise<RemoveHelpCenterDomainResponse> {
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
