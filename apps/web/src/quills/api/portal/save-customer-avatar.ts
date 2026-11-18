import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills-public"][":workspace"]["user"]["avatar"].$put;
export type SaveCustomerAvatarRequest = InferRequestType<typeof endpoint>;
export type SaveCustomerAvatarResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const saveCustomerAvatarKey = (
  input: SaveCustomerAvatarRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspace,
    viewer,
    "portal",
    "saveCustomerAvatar",
    input,
  );
export async function saveCustomerAvatar(
  input: SaveCustomerAvatarRequest,
): Promise<SaveCustomerAvatarResponse> {
  try {
    const response = await endpoint(input);
    if (!response.ok) throw await toPortalProblem(response, "record", false);
    return response.json();
  } catch (error) {
    if (typeof error === "object" && error !== null && "kind" in error)
      throw error;
    throw networkPortalProblem();
  }
}
