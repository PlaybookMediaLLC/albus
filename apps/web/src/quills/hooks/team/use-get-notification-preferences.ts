import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getNotificationPreferencesQuery,
  type GetNotificationPreferencesRequest,
} from "../../api/team/get-notification-preferences";
export function useGetNotificationPreferences(
  input: GetNotificationPreferencesRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getNotificationPreferencesQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
