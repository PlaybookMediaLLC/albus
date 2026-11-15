import { useInfiniteQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listUserCommentsInfiniteQuery,
  type ListUserCommentsRequest,
} from "../../api/team/list-user-comments";
export function useListUserComments(
  input: ListUserCommentsRequest,
  viewer: Viewer,
) {
  return useInfiniteQuery({
    ...listUserCommentsInfiniteQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.principalId),
  });
}
