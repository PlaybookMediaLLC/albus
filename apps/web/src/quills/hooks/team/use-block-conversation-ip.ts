import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  blockConversationIp,
  type BlockConversationIpRequest,
  type BlockConversationIpResponse,
} from "../../api/team/block-conversation-ip";
export function useBlockConversationIp(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    BlockConversationIpResponse,
    PortalProblem,
    BlockConversationIpRequest
  >({
    mutationFn: (input) => blockConversationIp(input),
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
