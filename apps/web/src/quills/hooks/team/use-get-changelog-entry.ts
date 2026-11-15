import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getChangelogEntryQuery,
  type GetChangelogEntryRequest,
} from "../../api/team/get-changelog-entry";
export function useGetChangelogEntry(
  input: GetChangelogEntryRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getChangelogEntryQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.entryId),
  });
}
