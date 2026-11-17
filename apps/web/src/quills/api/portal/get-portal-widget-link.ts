import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint =
  client["quills-public"][":workspace"]["portal"]["widget-link"].$get;
export type GetPortalWidgetLinkRequest = InferRequestType<typeof endpoint>;
export type GetPortalWidgetLinkResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const getPortalWidgetLinkKey = (
  input: GetPortalWidgetLinkRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspace,
    viewer,
    "portal",
    "getPortalWidgetLink",
    input,
  );
export async function getPortalWidgetLink(
  input: GetPortalWidgetLinkRequest,
): Promise<GetPortalWidgetLinkResponse> {
  try {
    const response = await endpoint(input);
    if (!response.ok) throw await toPortalProblem(response, "record", false);
    return response.json();
  } catch (error) {
    if (typeof error === "object" && error !== null && "kind" in error)
      throw error;
    throw networkPortalProblem();
  }
}
export const getPortalWidgetLinkQuery = (
  input: GetPortalWidgetLinkRequest,
  viewer: Viewer,
) =>
  queryOptions<GetPortalWidgetLinkResponse, PortalProblem>({
    queryKey: getPortalWidgetLinkKey(input, viewer),
    queryFn: () => getPortalWidgetLink(input),
  });
