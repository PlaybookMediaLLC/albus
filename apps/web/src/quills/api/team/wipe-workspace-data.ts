import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["operations"]["wipe"].$post;
export type WipeWorkspaceDataRequest = InferRequestType<typeof endpoint>;
export type WipeWorkspaceDataResponse = InferResponseType<typeof endpoint, 200>;
export const wipeWorkspaceDataKey = (
  input: WipeWorkspaceDataRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "wipeWorkspaceData",
    input,
  );
export async function wipeWorkspaceData(
  input: WipeWorkspaceDataRequest,
): Promise<WipeWorkspaceDataResponse> {
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
