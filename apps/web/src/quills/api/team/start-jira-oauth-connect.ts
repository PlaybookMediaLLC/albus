import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["jira"]["connect"].$get;
export type StartJiraOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartJiraOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startJiraOAuthConnectKey = (
  input: StartJiraOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startJiraOAuthConnect",
    input,
  );
export async function startJiraOAuthConnect(
  input: StartJiraOAuthConnectRequest,
): Promise<StartJiraOAuthConnectResponse> {
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
export const startJiraOAuthConnectQuery = (
  input: StartJiraOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartJiraOAuthConnectResponse, PortalProblem>({
    queryKey: startJiraOAuthConnectKey(input, viewer),
    queryFn: () => startJiraOAuthConnect(input),
  });
