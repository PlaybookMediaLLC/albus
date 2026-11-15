import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updatePortalSettings,
  type UpdatePortalSettingsRequest,
  type UpdatePortalSettingsResponse,
} from "../../api/team/update-portal-settings";
export function useUpdatePortalSettings(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdatePortalSettingsResponse,
    PortalProblem,
    UpdatePortalSettingsRequest
  >({
    mutationFn: (input) => updatePortalSettings(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getPortalSettings",
        ),
      });
    },
  });
}
