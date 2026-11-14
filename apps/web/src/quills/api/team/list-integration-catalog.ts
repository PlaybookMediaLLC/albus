import type { InferRequestType, InferResponseType } from "hono/client";
import { queryOptions } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { client } from "../client";
import { networkPortalProblem, toPortalProblem } from "../errors";
import { quillsKey } from "../keys";

const endpoint = client["quills"][":workspaceId"]["integration-catalog"].$get;
export type ListIntegrationCatalogRequest = InferRequestType<typeof endpoint>;
export type ListIntegrationCatalogResponse = InferResponseType<
  typeof endpoint,
  200
>;
export const listIntegrationCatalogKey = (
  input: ListIntegrationCatalogRequest,
  viewer: Viewer,
) =>
  quillsKey(
    input.param.workspaceId,
    viewer,
    "team",
    "listIntegrationCatalog",
    input,
  );
export async function listIntegrationCatalog(
  input: ListIntegrationCatalogRequest,
): Promise<ListIntegrationCatalogResponse> {
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
export const listIntegrationCatalogQuery = (
  input: ListIntegrationCatalogRequest,
  viewer: Viewer,
) =>
  queryOptions<ListIntegrationCatalogResponse, PortalProblem>({
    queryKey: listIntegrationCatalogKey(input, viewer),
    queryFn: () => listIntegrationCatalog(input),
  });
