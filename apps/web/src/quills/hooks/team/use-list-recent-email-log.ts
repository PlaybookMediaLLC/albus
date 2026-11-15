import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listRecentEmailLogQuery,
  type ListRecentEmailLogRequest,
} from "../../api/team/list-recent-email-log";
export function useListRecentEmailLog(
  input: ListRecentEmailLogRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listRecentEmailLogQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
