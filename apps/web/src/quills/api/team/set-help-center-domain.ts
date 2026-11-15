import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["domains"]["help-center"].$put;
export type SetHelpCenterDomainRequest = InferRequestType<typeof endpoint>;
export type SetHelpCenterDomainResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setHelpCenterDomainKey = (
  input: SetHelpCenterDomainRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setHelpCenterDomain",
    input,
  );
export async function setHelpCenterDomain(
  input: SetHelpCenterDomainRequest,
): Promise<SetHelpCenterDomainResponse> {
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
