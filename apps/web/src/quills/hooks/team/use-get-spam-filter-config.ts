import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getSpamFilterConfigQuery,
  type GetSpamFilterConfigRequest,
} from "../../api/team/get-spam-filter-config";
export function useGetSpamFilterConfig(
  input: GetSpamFilterConfigRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getSpamFilterConfigQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
