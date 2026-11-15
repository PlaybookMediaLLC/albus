import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listSlaPolicyOptionsQuery,
  type ListSlaPolicyOptionsRequest,
} from "../../api/team/list-sla-policy-options";
export function useListSlaPolicyOptions(
  input: ListSlaPolicyOptionsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listSlaPolicyOptionsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
