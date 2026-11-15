import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  disableHelpCenterLocale,
  type DisableHelpCenterLocaleRequest,
  type DisableHelpCenterLocaleResponse,
} from "../../api/team/disable-help-center-locale";
export function useDisableHelpCenterLocale(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DisableHelpCenterLocaleResponse,
    PortalProblem,
    DisableHelpCenterLocaleRequest
  >({
    mutationFn: (input) => disableHelpCenterLocale(input),
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
