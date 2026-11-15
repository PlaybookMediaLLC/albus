import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getModerationStatusQuery,
  type GetModerationStatusRequest,
} from "../../api/team/get-moderation-status";
export function useGetModerationStatus(
  input: GetModerationStatusRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getModerationStatusQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
