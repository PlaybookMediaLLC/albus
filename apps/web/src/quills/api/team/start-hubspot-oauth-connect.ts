import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["hubspot"]["connect"].$get;
export type StartHubspotOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartHubspotOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startHubspotOAuthConnectKey = (
  input: StartHubspotOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startHubspotOAuthConnect",
    input,
  );
export async function startHubspotOAuthConnect(
  input: StartHubspotOAuthConnectRequest,
): Promise<StartHubspotOAuthConnectResponse> {
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
export const startHubspotOAuthConnectQuery = (
  input: StartHubspotOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartHubspotOAuthConnectResponse, PortalProblem>({
    queryKey: startHubspotOAuthConnectKey(input, viewer),
    queryFn: () => startHubspotOAuthConnect(input),
  });
