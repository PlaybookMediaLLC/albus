import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["gitlab"]["connect"].$get;
export type StartGitlabOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartGitlabOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startGitlabOAuthConnectKey = (
  input: StartGitlabOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startGitlabOAuthConnect",
    input,
  );
export async function startGitlabOAuthConnect(
  input: StartGitlabOAuthConnectRequest,
): Promise<StartGitlabOAuthConnectResponse> {
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
export const startGitlabOAuthConnectQuery = (
  input: StartGitlabOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartGitlabOAuthConnectResponse, PortalProblem>({
    queryKey: startGitlabOAuthConnectKey(input, viewer),
    queryFn: () => startGitlabOAuthConnect(input),
  });
