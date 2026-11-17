import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listPostTasksQuery,
  type ListPostTasksRequest,
} from "../../api/team/list-post-tasks";
export function useListPostTasks(input: ListPostTasksRequest, viewer: Viewer) {
  return useQuery({
    ...listPostTasksQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.postId),
  });
}
