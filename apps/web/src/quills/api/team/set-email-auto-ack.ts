import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-auto-ack"].$put;
export type SetEmailAutoAckRequest = InferRequestType<typeof endpoint>;
export type SetEmailAutoAckResponse = InferResponseType<typeof endpoint, 200>;
export const setEmailAutoAckKey = (
  input: SetEmailAutoAckRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setEmailAutoAck", input);
export async function setEmailAutoAck(
  input: SetEmailAutoAckRequest,
): Promise<SetEmailAutoAckResponse> {
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
