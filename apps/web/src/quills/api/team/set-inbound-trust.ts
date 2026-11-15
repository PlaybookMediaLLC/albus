import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"]["inbound"][
    "trust"
  ].$put;
export type SetInboundTrustRequest = InferRequestType<typeof endpoint>;
export type SetInboundTrustResponse = InferResponseType<typeof endpoint, 200>;
export const setInboundTrustKey = (
  input: SetInboundTrustRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setInboundTrust", input);
export async function setInboundTrust(
  input: SetInboundTrustRequest,
): Promise<SetInboundTrustResponse> {
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
