import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["settings"]["logo"].$put;
export type SaveLogoKeyRequest = InferRequestType<typeof endpoint>;
export type SaveLogoKeyResponse = InferResponseType<typeof endpoint, 200>;
export const saveLogoKeyKey = (input: SaveLogoKeyRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "saveLogoKey", input);
export async function saveLogoKey(
  input: SaveLogoKeyRequest,
): Promise<SaveLogoKeyResponse> {
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
