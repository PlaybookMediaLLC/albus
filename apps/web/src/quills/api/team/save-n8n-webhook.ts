import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["n8n"]["connection"].$put;
export type SaveN8nWebhookRequest = InferRequestType<typeof endpoint>;
export type SaveN8nWebhookResponse = InferResponseType<typeof endpoint, 200>;
export const saveN8nWebhookKey = (
  input: SaveN8nWebhookRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "saveN8nWebhook", input);
export async function saveN8nWebhook(
  input: SaveN8nWebhookRequest,
): Promise<SaveN8nWebhookResponse> {
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
