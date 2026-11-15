import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["teams"]["connect"].$get;
export type StartTeamsOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartTeamsOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startTeamsOAuthConnectKey = (
  input: StartTeamsOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startTeamsOAuthConnect",
    input,
  );
export async function startTeamsOAuthConnect(
  input: StartTeamsOAuthConnectRequest,
): Promise<StartTeamsOAuthConnectResponse> {
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
export const startTeamsOAuthConnectQuery = (
  input: StartTeamsOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartTeamsOAuthConnectResponse, PortalProblem>({
    queryKey: startTeamsOAuthConnectKey(input, viewer),
    queryFn: () => startTeamsOAuthConnect(input),
  });
