import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  restartSendingDomainChecks,
  type RestartSendingDomainChecksRequest,
  type RestartSendingDomainChecksResponse,
} from "../../api/team/restart-sending-domain-checks";
export function useRestartSendingDomainChecks(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    RestartSendingDomainChecksResponse,
    PortalProblem,
    RestartSendingDomainChecksRequest
  >({
    mutationFn: (input) => restartSendingDomainChecks(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getEmailChannelConfig",
        ),
      });
    },
  });
}
