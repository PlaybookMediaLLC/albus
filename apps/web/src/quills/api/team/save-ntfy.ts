import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["ntfy"]["connection"].$put;
export type SaveNtfyRequest = InferRequestType<typeof endpoint>;
export type SaveNtfyResponse = InferResponseType<typeof endpoint, 200>;
export const saveNtfyKey = (input: SaveNtfyRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "saveNtfy", input);
export async function saveNtfy(
  input: SaveNtfyRequest,
): Promise<SaveNtfyResponse> {
  try {
    const response = await endpoint(input);
    if (!response.ok) throw await toPortalProblem(response, "teammate", true);
    return response.json();
  } catch (error) {
    if (typeof error === "object" && error !== null && "kind" in error)
      throw error;
    throw networkPortalProblem();
  }
}
