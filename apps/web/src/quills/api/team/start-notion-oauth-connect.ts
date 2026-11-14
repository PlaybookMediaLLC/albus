import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["notion"]["connect"].$get;
export type StartNotionOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartNotionOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startNotionOAuthConnectKey = (
  input: StartNotionOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startNotionOAuthConnect",
    input,
  );
export async function startNotionOAuthConnect(
  input: StartNotionOAuthConnectRequest,
): Promise<StartNotionOAuthConnectResponse> {
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
export const startNotionOAuthConnectQuery = (
  input: StartNotionOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartNotionOAuthConnectResponse, PortalProblem>({
    queryKey: startNotionOAuthConnectKey(input, viewer),
    queryFn: () => startNotionOAuthConnect(input),
  });
