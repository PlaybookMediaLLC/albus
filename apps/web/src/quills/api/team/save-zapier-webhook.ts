import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["zapier"]["connection"].$put;
export type SaveZapierWebhookRequest = InferRequestType<typeof endpoint>;
export type SaveZapierWebhookResponse = InferResponseType<typeof endpoint, 200>;
export const saveZapierWebhookKey = (
  input: SaveZapierWebhookRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "saveZapierWebhook",
    input,
  );
export async function saveZapierWebhook(
  input: SaveZapierWebhookRequest,
): Promise<SaveZapierWebhookResponse> {
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
