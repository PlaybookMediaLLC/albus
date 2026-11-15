import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  verifyPortalDomain,
  type VerifyPortalDomainRequest,
  type VerifyPortalDomainResponse,
} from "../../api/team/verify-portal-domain";
export function useVerifyPortalDomain(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    VerifyPortalDomainResponse,
    PortalProblem,
    VerifyPortalDomainRequest
  >({
    mutationFn: (input) => verifyPortalDomain(input),
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
