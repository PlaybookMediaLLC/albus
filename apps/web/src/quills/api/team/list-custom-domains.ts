import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["operations"]["domains"].$get;
export type ListCustomDomainsRequest = InferRequestType<typeof endpoint>;
export type ListCustomDomainsResponse = InferResponseType<typeof endpoint, 200>;
export const listCustomDomainsKey = (
  input: ListCustomDomainsRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listCustomDomains",
    input,
  );
export async function listCustomDomains(
  input: ListCustomDomainsRequest,
): Promise<ListCustomDomainsResponse> {
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
export const listCustomDomainsQuery = (
  input: ListCustomDomainsRequest,
  viewer: Viewer,
) =>
  queryOptions<ListCustomDomainsResponse, PortalProblem>({
    queryKey: listCustomDomainsKey(input, viewer),
    queryFn: () => listCustomDomains(input),
  });
