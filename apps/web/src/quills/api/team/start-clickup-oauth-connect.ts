import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["clickup"]["connect"].$get;
export type StartClickupOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartClickupOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startClickupOAuthConnectKey = (
  input: StartClickupOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startClickupOAuthConnect",
    input,
  );
export async function startClickupOAuthConnect(
  input: StartClickupOAuthConnectRequest,
): Promise<StartClickupOAuthConnectResponse> {
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
export const startClickupOAuthConnectQuery = (
  input: StartClickupOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartClickupOAuthConnectResponse, PortalProblem>({
    queryKey: startClickupOAuthConnectKey(input, viewer),
    queryFn: () => startClickupOAuthConnect(input),
  });
