import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["integrations"]["azure-devops"]["connection"]
    .$put;
export type SaveAzureDevopsKeyRequest = InferRequestType<typeof endpoint>;
export type SaveAzureDevopsKeyResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const saveAzureDevopsKeyKey = (
  input: SaveAzureDevopsKeyRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "saveAzureDevopsKey",
    input,
  );
export async function saveAzureDevopsKey(
  input: SaveAzureDevopsKeyRequest,
): Promise<SaveAzureDevopsKeyResponse> {
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
