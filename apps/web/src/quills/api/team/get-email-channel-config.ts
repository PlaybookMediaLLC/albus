import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"].$get;
export type GetEmailChannelConfigRequest = InferRequestType<typeof endpoint>;
export type GetEmailChannelConfigResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getEmailChannelConfigKey = (
  input: GetEmailChannelConfigRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getEmailChannelConfig",
    input,
  );
export async function getEmailChannelConfig(
  input: GetEmailChannelConfigRequest,
): Promise<GetEmailChannelConfigResponse> {
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
export const getEmailChannelConfigQuery = (
  input: GetEmailChannelConfigRequest,
  viewer: Viewer,
) =>
  queryOptions<GetEmailChannelConfigResponse, PortalProblem>({
    queryKey: getEmailChannelConfigKey(input, viewer),
    queryFn: () => getEmailChannelConfig(input),
  });
