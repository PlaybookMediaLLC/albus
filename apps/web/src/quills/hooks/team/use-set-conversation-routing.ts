import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setConversationRouting,
  type SetConversationRoutingRequest,
  type SetConversationRoutingResponse,
} from "../../api/team/set-conversation-routing";
export function useSetConversationRouting(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetConversationRoutingResponse,
    PortalProblem,
    SetConversationRoutingRequest
  >({
    mutationFn: (input) => setConversationRouting(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getConversationRouting",
        ),
      });
    },
  });
}
