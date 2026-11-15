import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateNotificationPreferences,
  type UpdateNotificationPreferencesRequest,
  type UpdateNotificationPreferencesResponse,
} from "../../api/team/update-notification-preferences";
export function useUpdateNotificationPreferences(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateNotificationPreferencesResponse,
    PortalProblem,
    UpdateNotificationPreferencesRequest
  >({
    mutationFn: (input) => updateNotificationPreferences(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getNotificationPreferences",
        ),
      });
    },
  });
}
