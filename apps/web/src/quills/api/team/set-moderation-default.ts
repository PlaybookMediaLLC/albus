import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["moderation"]["default"].$put;
export type SetModerationDefaultRequest = InferRequestType<typeof endpoint>;
export type SetModerationDefaultResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const setModerationDefaultKey = (
  input: SetModerationDefaultRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "setModerationDefault",
    input,
  );
export async function setModerationDefault(
  input: SetModerationDefaultRequest,
): Promise<SetModerationDefaultResponse> {
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
