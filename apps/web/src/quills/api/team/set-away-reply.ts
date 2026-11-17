import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["support"]["away-reply"].$put;
export type SetAwayReplyRequest = InferRequestType<typeof endpoint>;
export type SetAwayReplyResponse = InferResponseType<typeof endpoint, 200>;
export const setAwayReplyKey = (input: SetAwayReplyRequest, viewer: Viewer) =>
  quillsKey(input.param.workspaceId, viewer, "team", "setAwayReply", input);
export async function setAwayReply(
  input: SetAwayReplyRequest,
): Promise<SetAwayReplyResponse> {
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
