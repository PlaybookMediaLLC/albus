import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["stripe"]["connection"].$put;
export type SaveStripeKeyRequest = InferRequestType<typeof endpoint>;
export type SaveStripeKeyResponse = InferResponseType<typeof endpoint, 200>;
export const saveStripeKeyKey = (input: SaveStripeKeyRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "saveStripeKey", input);
export async function saveStripeKey(
  input: SaveStripeKeyRequest,
): Promise<SaveStripeKeyResponse> {
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
