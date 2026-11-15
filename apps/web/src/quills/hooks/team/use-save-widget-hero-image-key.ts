import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  saveWidgetHeroImageKey,
  type SaveWidgetHeroImageKeyRequest,
  type SaveWidgetHeroImageKeyResponse,
} from "../../api/team/save-widget-hero-image-key";
export function useSaveWidgetHeroImageKey(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SaveWidgetHeroImageKeyResponse,
    PortalProblem,
    SaveWidgetHeroImageKeyRequest
  >({
    mutationFn: (input) => saveWidgetHeroImageKey(input),
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
