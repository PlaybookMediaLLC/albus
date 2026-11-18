import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills-public"][":workspace"]["user"]["avatar"].$delete;
export type DeleteCustomerAvatarRequest = InferRequestType<typeof endpoint>;
export type DeleteCustomerAvatarResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const deleteCustomerAvatarKey = (
  input: DeleteCustomerAvatarRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspace,
    viewer,
    "portal",
    "deleteCustomerAvatar",
    input,
  );
export async function deleteCustomerAvatar(
  input: DeleteCustomerAvatarRequest,
): Promise<DeleteCustomerAvatarResponse> {
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
