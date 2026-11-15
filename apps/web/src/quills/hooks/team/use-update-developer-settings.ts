import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateDeveloperSettings,
  type UpdateDeveloperSettingsRequest,
  type UpdateDeveloperSettingsResponse,
} from "../../api/team/update-developer-settings";
export function useUpdateDeveloperSettings(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateDeveloperSettingsResponse,
    PortalProblem,
    UpdateDeveloperSettingsRequest
  >({
    mutationFn: (input) => updateDeveloperSettings(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getDeveloperSettings",
        ),
      });
    },
  });
}
