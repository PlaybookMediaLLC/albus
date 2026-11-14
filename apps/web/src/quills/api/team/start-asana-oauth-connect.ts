import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["oauth"]["asana"]["connect"].$get;
export type StartAsanaOAuthConnectRequest = InferRequestType<typeof endpoint>;
export type StartAsanaOAuthConnectResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const startAsanaOAuthConnectKey = (
  input: StartAsanaOAuthConnectRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "startAsanaOAuthConnect",
    input,
  );
export async function startAsanaOAuthConnect(
  input: StartAsanaOAuthConnectRequest,
): Promise<StartAsanaOAuthConnectResponse> {
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
export const startAsanaOAuthConnectQuery = (
  input: StartAsanaOAuthConnectRequest,
  viewer: Viewer,
) =>
  queryOptions<StartAsanaOAuthConnectResponse, PortalProblem>({
    queryKey: startAsanaOAuthConnectKey(input, viewer),
    queryFn: () => startAsanaOAuthConnect(input),
  });
