import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["intercom"]["connect"].$get;
export type StartIntercomOAuthConnectRequest = InferRequestType<
  typeof endpoint
>;
export type StartIntercomOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startIntercomOAuthConnectKey = (
  input: StartIntercomOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startIntercomOAuthConnect",
    input,
  );
export async function startIntercomOAuthConnect(
  input: StartIntercomOAuthConnectRequest,
): Promise<StartIntercomOAuthConnectResponse> {
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
export const startIntercomOAuthConnectQuery = (
  input: StartIntercomOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartIntercomOAuthConnectResponse, PortalProblem>({
    queryKey: startIntercomOAuthConnectKey(input, viewer),
    queryFn: () => startIntercomOAuthConnect(input),
  });
