import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"][
    "sending-addresses"
  ][":channelAccountId"].$delete;
export type DeleteChannelAccountRequest = InferRequestType<typeof endpoint>;
export type DeleteChannelAccountResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const deleteChannelAccountKey = (
  input: DeleteChannelAccountRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "deleteChannelAccount",
    input,
  );
export async function deleteChannelAccount(
  input: DeleteChannelAccountRequest,
): Promise<DeleteChannelAccountResponse> {
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
