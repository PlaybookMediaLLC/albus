import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["transfer"]["import-runs"].$post;
export type CreateImportRequest = InferRequestType<typeof endpoint>;
export type CreateImportResponse = InferResponseType<typeof endpoint, 200>;
export const createImportKey = (input: CreateImportRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "createImport", input);
export async function createImport(
  input: CreateImportRequest,
): Promise<CreateImportResponse> {
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
