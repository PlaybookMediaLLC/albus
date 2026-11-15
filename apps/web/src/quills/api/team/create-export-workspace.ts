import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["transfer"]["export-runs"].$post;
export type CreateExportWorkspaceRequest = InferRequestType<typeof endpoint>;
export type CreateExportWorkspaceResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createExportWorkspaceKey = (
  input: CreateExportWorkspaceRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createExportWorkspace",
    input,
  );
export async function createExportWorkspace(
  input: CreateExportWorkspaceRequest,
): Promise<CreateExportWorkspaceResponse> {
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
