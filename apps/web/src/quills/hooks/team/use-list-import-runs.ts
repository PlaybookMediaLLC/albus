import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listImportRunsQuery,
  type ListImportRunsRequest,
} from "../../api/team/list-import-runs";
// Poll while a run waits or runs, and stop after a failed request. The framework allows
// no poll interval below 10 seconds. A dry run is a final state.
const active = new Set(["pending", "running"]);

export function useListImportRuns(
  input: ListImportRunsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listImportRunsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
    refetchInterval: (query) =>
      !query.state.error &&
      query.state.data?.items.some((run) => active.has(run.status))
        ? 10_000
        : false,
    refetchIntervalInBackground: false,
  });
}
