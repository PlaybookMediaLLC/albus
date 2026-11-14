import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["github"]["connect"].$get;
export type StartGithubOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartGithubOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startGithubOAuthConnectKey = (
  input: StartGithubOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startGithubOAuthConnect",
    input,
  );
export async function startGithubOAuthConnect(
  input: StartGithubOAuthConnectRequest,
): Promise<StartGithubOAuthConnectResponse> {
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
export const startGithubOAuthConnectQuery = (
  input: StartGithubOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartGithubOAuthConnectResponse, PortalProblem>({
    queryKey: startGithubOAuthConnectKey(input, viewer),
    queryFn: () => startGithubOAuthConnect(input),
  });
