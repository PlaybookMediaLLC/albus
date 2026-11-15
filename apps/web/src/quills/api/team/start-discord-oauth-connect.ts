import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["discord"]["connect"].$get;
export type StartDiscordOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartDiscordOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startDiscordOAuthConnectKey = (
  input: StartDiscordOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startDiscordOAuthConnect",
    input,
  );
export async function startDiscordOAuthConnect(
  input: StartDiscordOAuthConnectRequest,
): Promise<StartDiscordOAuthConnectResponse> {
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
export const startDiscordOAuthConnectQuery = (
  input: StartDiscordOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartDiscordOAuthConnectResponse, PortalProblem>({
    queryKey: startDiscordOAuthConnectKey(input, viewer),
    queryFn: () => startDiscordOAuthConnect(input),
  });
