import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["integrations"].$get;
export type ListIntegrationsRequest = InferRequestType<typeof endpoint>;
export type ListIntegrationsResponse = InferResponseType<typeof endpoint, 200>;
export const listIntegrationsKey = (
  input: ListIntegrationsRequest,
  viewer: Viewer,
) =>
  quillsKey(input.param.workspaceId, viewer, "team", "listIntegrations", input);
export async function listIntegrations(
  input: ListIntegrationsRequest,
): Promise<ListIntegrationsResponse> {
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
export const listIntegrationsQuery = (
  input: ListIntegrationsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListIntegrationsResponse, PortalProblem>({
    queryKey: listIntegrationsKey(input, viewer),
    queryFn: () => listIntegrations(input),
  });
