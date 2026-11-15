import type { InferRequestType, InferResponseType } from "hono/client";
import type { Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"]["domains"][
    ":sendingDomainId"
  ]["checks"].$post;
export type RestartSendingDomainChecksRequest = InferRequestType<
  typeof endpoint
>;
export type RestartSendingDomainChecksResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const restartSendingDomainChecksKey = (
  input: RestartSendingDomainChecksRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "restartSendingDomainChecks",
    input,
  );
export async function restartSendingDomainChecks(
  input: RestartSendingDomainChecksRequest,
): Promise<RestartSendingDomainChecksResponse> {
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
