import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["zendesk"]["connect"].$get;
export type StartZendeskOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartZendeskOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startZendeskOAuthConnectKey = (
  input: StartZendeskOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startZendeskOAuthConnect",
    input,
  );
export async function startZendeskOAuthConnect(
  input: StartZendeskOAuthConnectRequest,
): Promise<StartZendeskOAuthConnectResponse> {
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
export const startZendeskOAuthConnectQuery = (
  input: StartZendeskOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartZendeskOAuthConnectResponse, PortalProblem>({
    queryKey: startZendeskOAuthConnectKey(input, viewer),
    queryFn: () => startZendeskOAuthConnect(input),
  });
