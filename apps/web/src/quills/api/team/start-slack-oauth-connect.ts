import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["slack"]["connect"].$get;
export type StartSlackOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartSlackOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startSlackOAuthConnectKey = (
  input: StartSlackOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startSlackOAuthConnect",
    input,
  );
export async function startSlackOAuthConnect(
  input: StartSlackOAuthConnectRequest,
): Promise<StartSlackOAuthConnectResponse> {
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
export const startSlackOAuthConnectQuery = (
  input: StartSlackOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartSlackOAuthConnectResponse, PortalProblem>({
    queryKey: startSlackOAuthConnectKey(input, viewer),
    queryFn: () => startSlackOAuthConnect(input),
  });
