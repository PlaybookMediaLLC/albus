import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listPendingModerationQuery,
  type ListPendingModerationRequest,
} from "../../api/team/list-pending-moderation";
export function useListPendingModeration(
  input: ListPendingModerationRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listPendingModerationQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
