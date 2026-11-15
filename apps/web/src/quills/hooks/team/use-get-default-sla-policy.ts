import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getDefaultSlaPolicyQuery,
  type GetDefaultSlaPolicyRequest,
} from "../../api/team/get-default-sla-policy";
export function useGetDefaultSlaPolicy(
  input: GetDefaultSlaPolicyRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getDefaultSlaPolicyQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
