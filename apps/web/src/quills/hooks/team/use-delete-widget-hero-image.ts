import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteWidgetHeroImage,
  type DeleteWidgetHeroImageRequest,
  type DeleteWidgetHeroImageResponse,
} from "../../api/team/delete-widget-hero-image";
export function useDeleteWidgetHeroImage(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteWidgetHeroImageResponse,
    PortalProblem,
    DeleteWidgetHeroImageRequest
  >({
    mutationFn: (input) => deleteWidgetHeroImage(input),
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
