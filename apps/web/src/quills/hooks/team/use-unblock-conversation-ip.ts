import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  unblockConversationIp,
  type UnblockConversationIpRequest,
  type UnblockConversationIpResponse,
} from "../../api/team/unblock-conversation-ip";
export function useUnblockConversationIp(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UnblockConversationIpResponse,
    PortalProblem,
    UnblockConversationIpRequest
  >({
    mutationFn: (input) => unblockConversationIp(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getConversationIpBlock",
        ),
      });
    },
  });
}
