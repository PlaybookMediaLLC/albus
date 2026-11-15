import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["salesforce"]["connect"].$get;
export type StartSalesforceOAuthConnectRequest = InferRequestType<
  typeof endpoint
>;
export type StartSalesforceOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startSalesforceOAuthConnectKey = (
  input: StartSalesforceOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startSalesforceOAuthConnect",
    input,
  );
export async function startSalesforceOAuthConnect(
  input: StartSalesforceOAuthConnectRequest,
): Promise<StartSalesforceOAuthConnectResponse> {
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
export const startSalesforceOAuthConnectQuery = (
  input: StartSalesforceOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartSalesforceOAuthConnectResponse, PortalProblem>({
    queryKey: startSalesforceOAuthConnectKey(input, viewer),
    queryFn: () => startSalesforceOAuthConnect(input),
  });
