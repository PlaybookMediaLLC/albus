import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["make"]["connection"].$put;
export type SaveMakeWebhookRequest = InferRequestType<typeof endpoint>;
export type SaveMakeWebhookResponse = InferResponseType<typeof endpoint, 200>;
export const saveMakeWebhookKey = (
  input: SaveMakeWebhookRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "saveMakeWebhook", input);
export async function saveMakeWebhook(
  input: SaveMakeWebhookRequest,
): Promise<SaveMakeWebhookResponse> {
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
