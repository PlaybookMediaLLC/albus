import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["freshdesk"]["connection"]
    .$put;
export type SaveFreshdeskKeyRequest = InferRequestType<typeof endpoint>;
export type SaveFreshdeskKeyResponse = InferResponseType<typeof endpoint, 200>;
export const saveFreshdeskKeyKey = (
  input: SaveFreshdeskKeyRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "saveFreshdeskKey", input);
export async function saveFreshdeskKey(
  input: SaveFreshdeskKeyRequest,
): Promise<SaveFreshdeskKeyResponse> {
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
