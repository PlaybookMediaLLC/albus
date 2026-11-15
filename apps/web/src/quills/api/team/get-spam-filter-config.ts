import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills"][":workspaceId"]["support"]["spam-filter"].$get;
export type GetSpamFilterConfigRequest = InferRequestType<typeof endpoint>;
export type GetSpamFilterConfigResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getSpamFilterConfigKey = (
  input: GetSpamFilterConfigRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "getSpamFilterConfig",
    input,
  );
export async function getSpamFilterConfig(
  input: GetSpamFilterConfigRequest,
): Promise<GetSpamFilterConfigResponse> {
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
export const getSpamFilterConfigQuery = (
  input: GetSpamFilterConfigRequest,
  viewer: Viewer,
) =>
  queryOptions<GetSpamFilterConfigResponse, PortalProblem>({
    queryKey: getSpamFilterConfigKey(input, viewer),
    queryFn: () => getSpamFilterConfig(input),
  });
