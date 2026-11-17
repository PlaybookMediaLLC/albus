import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateChangelogSettings,
  type UpdateChangelogSettingsRequest,
  type UpdateChangelogSettingsResponse,
} from "../../api/team/update-changelog-settings";
export function useUpdateChangelogSettings(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateChangelogSettingsResponse,
    PortalProblem,
    UpdateChangelogSettingsRequest
  >({
    mutationFn: (input) => updateChangelogSettings(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getChangelogSettings",
        ),
      });
    },
  });
}
