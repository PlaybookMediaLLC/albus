import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  rotateWidgetSecret,
  type RotateWidgetSecretRequest,
  type RotateWidgetSecretResponse,
} from "../../api/team/rotate-widget-secret";
export function useRotateWidgetSecret(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    RotateWidgetSecretResponse,
    PortalProblem,
    RotateWidgetSecretRequest
  >({
    mutationFn: (input) => rotateWidgetSecret(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getWidgetSecret",
        ),
      });
    },
  });
}
