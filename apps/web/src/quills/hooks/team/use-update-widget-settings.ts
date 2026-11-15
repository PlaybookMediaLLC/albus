import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateWidgetSettings,
  type UpdateWidgetSettingsRequest,
  type UpdateWidgetSettingsResponse,
} from "../../api/team/update-widget-settings";
export function useUpdateWidgetSettings(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateWidgetSettingsResponse,
    PortalProblem,
    UpdateWidgetSettingsRequest
  >({
    mutationFn: (input) => updateWidgetSettings(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getWidgetSettings",
        ),
      });
    },
  });
}
