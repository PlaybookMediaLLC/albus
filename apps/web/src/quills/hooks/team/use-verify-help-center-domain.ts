import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  verifyHelpCenterDomain,
  type VerifyHelpCenterDomainRequest,
  type VerifyHelpCenterDomainResponse,
} from "../../api/team/verify-help-center-domain";
export function useVerifyHelpCenterDomain(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    VerifyHelpCenterDomainResponse,
    PortalProblem,
    VerifyHelpCenterDomainRequest
  >({
    mutationFn: (input) => verifyHelpCenterDomain(input),
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
