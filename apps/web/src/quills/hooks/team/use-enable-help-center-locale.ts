import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  enableHelpCenterLocale,
  type EnableHelpCenterLocaleRequest,
  type EnableHelpCenterLocaleResponse,
} from "../../api/team/enable-help-center-locale";
export function useEnableHelpCenterLocale(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    EnableHelpCenterLocaleResponse,
    PortalProblem,
    EnableHelpCenterLocaleRequest
  >({
    mutationFn: (input) => enableHelpCenterLocale(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getHelpCenterSettings",
        ),
      });
    },
  });
}
