import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateBrandingSettings,
  type UpdateBrandingSettingsRequest,
  type UpdateBrandingSettingsResponse,
} from "../../api/team/update-branding-settings";
export function useUpdateBrandingSettings(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateBrandingSettingsResponse,
    PortalProblem,
    UpdateBrandingSettingsRequest
  >({
    mutationFn: (input) => updateBrandingSettings(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getBrandingSettings",
        ),
      });
    },
  });
}
