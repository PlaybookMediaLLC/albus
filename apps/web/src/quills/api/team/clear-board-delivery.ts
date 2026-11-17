import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["boards"][":boardId"]["delivery"].$delete;
export type ClearBoardDeliveryRequest = InferRequestType<typeof endpoint>;
export type ClearBoardDeliveryResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const clearBoardDeliveryKey = (
  input: ClearBoardDeliveryRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "clearBoardDelivery",
    input,
  );
export async function clearBoardDelivery(
  input: ClearBoardDeliveryRequest,
): Promise<ClearBoardDeliveryResponse> {
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
