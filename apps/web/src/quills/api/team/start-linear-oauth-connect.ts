import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["linear"]["connect"].$get;
export type StartLinearOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartLinearOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startLinearOAuthConnectKey = (
  input: StartLinearOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startLinearOAuthConnect",
    input,
  );
export async function startLinearOAuthConnect(
  input: StartLinearOAuthConnectRequest,
): Promise<StartLinearOAuthConnectResponse> {
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
export const startLinearOAuthConnectQuery = (
  input: StartLinearOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartLinearOAuthConnectResponse, PortalProblem>({
    queryKey: startLinearOAuthConnectKey(input, viewer),
    queryFn: () => startLinearOAuthConnect(input),
  });
