import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["support"]["routing"].$put;
export type SetConversationRoutingRequest = InferRequestType<typeof endpoint>;
export type SetConversationRoutingResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setConversationRoutingKey = (
  input: SetConversationRoutingRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setConversationRouting",
    input,
  );
export async function setConversationRouting(
  input: SetConversationRoutingRequest,
): Promise<SetConversationRoutingResponse> {
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
