import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["operations"]["powered-by"].$put;
export type SetPoweredByRequest = InferRequestType<typeof endpoint>;
export type SetPoweredByResponse = InferResponseType<typeof endpoint, 200>;
export const setPoweredByKey = (input: SetPoweredByRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setPoweredBy", input);
export async function setPoweredBy(
  input: SetPoweredByRequest,
): Promise<SetPoweredByResponse> {
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
