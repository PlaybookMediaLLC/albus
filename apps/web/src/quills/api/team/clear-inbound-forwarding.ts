import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"]["inbound"][
    "forwarding"
  ].$delete;
export type ClearInboundForwardingRequest = InferRequestType<typeof endpoint>;
export type ClearInboundForwardingResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const clearInboundForwardingKey = (
  input: ClearInboundForwardingRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "clearInboundForwarding",
    input,
  );
export async function clearInboundForwarding(
  input: ClearInboundForwardingRequest,
): Promise<ClearInboundForwardingResponse> {
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
