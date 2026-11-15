import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listIntegrationCatalogQuery,
  type ListIntegrationCatalogRequest,
} from "../../api/team/list-integration-catalog";
export function useListIntegrationCatalog(
  input: ListIntegrationCatalogRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listIntegrationCatalogQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
