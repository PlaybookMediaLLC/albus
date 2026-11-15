import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateAssistantSettings,
  type UpdateAssistantSettingsRequest,
  type UpdateAssistantSettingsResponse,
} from "../../api/team/update-assistant-settings";
export function useUpdateAssistantSettings(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateAssistantSettingsResponse,
    PortalProblem,
    UpdateAssistantSettingsRequest
  >({
    mutationFn: (input) => updateAssistantSettings(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getAssistantSettings",
        ),
      });
    },
  });
}
