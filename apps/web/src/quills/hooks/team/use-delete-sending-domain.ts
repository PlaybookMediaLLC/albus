import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteSendingDomain,
  type DeleteSendingDomainRequest,
  type DeleteSendingDomainResponse,
} from "../../api/team/delete-sending-domain";
export function useDeleteSendingDomain(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteSendingDomainResponse,
    PortalProblem,
    DeleteSendingDomainRequest
  >({
    mutationFn: (input) => deleteSendingDomain(input),
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
