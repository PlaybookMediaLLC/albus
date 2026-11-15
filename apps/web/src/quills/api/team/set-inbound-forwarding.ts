import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"]["inbound"].$put;
export type SetInboundForwardingRequest = InferRequestType<typeof endpoint>;
export type SetInboundForwardingResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setInboundForwardingKey = (
  input: SetInboundForwardingRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setInboundForwarding",
    input,
  );
export async function setInboundForwarding(
  input: SetInboundForwardingRequest,
): Promise<SetInboundForwardingResponse> {
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
