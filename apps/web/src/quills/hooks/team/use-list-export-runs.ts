import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listExportRunsQuery,
  type ListExportRunsRequest,
} from "../../api/team/list-export-runs";
// Poll while a run waits or runs, and stop after a failed request. The framework allows
// no poll interval below 10 seconds.
const active = new Set(["pending", "running"]);

export function useListExportRuns(
  input: ListExportRunsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listExportRunsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
    refetchInterval: (query) =>
      !query.state.error &&
      query.state.data?.items.some((run) => active.has(run.status))
        ? 10_000
        : false,
    refetchIntervalInBackground: false,
  });
}
