import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listCustomDomainsQuery,
  type ListCustomDomainsRequest,
} from "../../api/team/list-custom-domains";
export function useListCustomDomains(
  input: ListCustomDomainsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listCustomDomainsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
