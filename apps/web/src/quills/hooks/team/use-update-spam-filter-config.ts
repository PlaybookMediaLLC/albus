import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateSpamFilterConfig,
  type UpdateSpamFilterConfigRequest,
  type UpdateSpamFilterConfigResponse,
} from "../../api/team/update-spam-filter-config";
export function useUpdateSpamFilterConfig(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateSpamFilterConfigResponse,
    PortalProblem,
    UpdateSpamFilterConfigRequest
  >({
    mutationFn: (input) => updateSpamFilterConfig(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getSpamFilterConfig",
        ),
      });
    },
  });
}
