import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listPostViewsQuery,
  type ListPostViewsRequest,
} from "../../api/team/list-post-views";
export function useListPostViews(input: ListPostViewsRequest, viewer: Viewer) {
  return useQuery({
    ...listPostViewsQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
