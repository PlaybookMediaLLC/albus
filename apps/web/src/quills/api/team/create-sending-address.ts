import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"][
    "sending-addresses"
  ].$post;
export type CreateSendingAddressRequest = InferRequestType<typeof endpoint>;
export type CreateSendingAddressResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const createSendingAddressKey = (
  input: CreateSendingAddressRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "createSendingAddress",
    input,
  );
export async function createSendingAddress(
  input: CreateSendingAddressRequest,
): Promise<CreateSendingAddressResponse> {
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
