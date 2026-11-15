import { useInfiniteQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listChangelogInfiniteQuery,
  type ListChangelogRequest,
} from "../../api/team/list-changelog";
export function useListChangelog(input: ListChangelogRequest, viewer: Viewer) {
  return useInfiniteQuery({
    ...listChangelogInfiniteQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
