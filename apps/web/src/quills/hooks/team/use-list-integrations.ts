import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listIntegrationsQuery,
  type ListIntegrationsRequest,
} from "../../api/team/list-integrations";
export function useListIntegrations(
  input: ListIntegrationsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listIntegrationsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
