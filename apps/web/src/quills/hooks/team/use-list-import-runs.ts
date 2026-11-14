import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listImportRunsQuery,
  type ListImportRunsRequest,
} from "../../api/team/list-import-runs";
// Poll while a run waits or runs. The framework allows no poll interval below 10 seconds.
const active = new Set(["pending", "dry_run", "running"]);

export function useListImportRuns(
  input: ListImportRunsRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listImportRunsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
    refetchInterval: (query) =>
      query.state.data?.items.some((run) => active.has(run.status))
        ? 10_000
        : false,
    refetchIntervalInBackground: false,
  });
}
