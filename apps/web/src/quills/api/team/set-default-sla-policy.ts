import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["default-sla-policy"].$put;
export type SetDefaultSlaPolicyRequest = InferRequestType<typeof endpoint>;
export type SetDefaultSlaPolicyResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setDefaultSlaPolicyKey = (
  input: SetDefaultSlaPolicyRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setDefaultSlaPolicy",
    input,
  );
export async function setDefaultSlaPolicy(
  input: SetDefaultSlaPolicyRequest,
): Promise<SetDefaultSlaPolicyResponse> {
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
