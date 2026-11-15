import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["email-channel"]["status"].$get;
export type GetEmailChannelStatusRequest = InferRequestType<typeof endpoint>;
export type GetEmailChannelStatusResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getEmailChannelStatusKey = (
  input: GetEmailChannelStatusRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getEmailChannelStatus",
    input,
  );
export async function getEmailChannelStatus(
  input: GetEmailChannelStatusRequest,
): Promise<GetEmailChannelStatusResponse> {
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
export const getEmailChannelStatusQuery = (
  input: GetEmailChannelStatusRequest,
  viewer: Viewer,
) =>
  queryOptions<GetEmailChannelStatusResponse, PortalProblem>({
    queryKey: getEmailChannelStatusKey(input, viewer),
    queryFn: () => getEmailChannelStatus(input),
  });
