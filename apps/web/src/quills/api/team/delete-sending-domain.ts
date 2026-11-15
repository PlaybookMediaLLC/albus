import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"]["domains"][
    ":sendingDomainId"
  ].$delete;
export type DeleteSendingDomainRequest = InferRequestType<typeof endpoint>;
export type DeleteSendingDomainResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const deleteSendingDomainKey = (
  input: DeleteSendingDomainRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "deleteSendingDomain",
    input,
  );
export async function deleteSendingDomain(
  input: DeleteSendingDomainRequest,
): Promise<DeleteSendingDomainResponse> {
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
