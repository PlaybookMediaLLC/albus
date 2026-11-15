import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["domains"]["portal"].$put;
export type SetPortalDomainRequest = InferRequestType<typeof endpoint>;
export type SetPortalDomainResponse = InferResponseType<typeof endpoint, 200>;
export const setPortalDomainKey = (
  input: SetPortalDomainRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setPortalDomain", input);
export async function setPortalDomain(
  input: SetPortalDomainRequest,
): Promise<SetPortalDomainResponse> {
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
