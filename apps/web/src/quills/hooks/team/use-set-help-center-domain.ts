import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setHelpCenterDomain,
  type SetHelpCenterDomainRequest,
  type SetHelpCenterDomainResponse,
} from "../../api/team/set-help-center-domain";
export function useSetHelpCenterDomain(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetHelpCenterDomainResponse,
    PortalProblem,
    SetHelpCenterDomainRequest
  >({
    mutationFn: (input) => setHelpCenterDomain(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listCustomDomains",
        ),
      });
    },
  });
}
