import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  unlinkPostFromConversation,
  type UnlinkPostFromConversationRequest,
  type UnlinkPostFromConversationResponse,
} from "../../api/team/unlink-post-from-conversation";
export function useUnlinkPostFromConversation(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UnlinkPostFromConversationResponse,
    PortalProblem,
    UnlinkPostFromConversationRequest
  >({
    mutationFn: (input) => unlinkPostFromConversation(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getLinkedPostsForConversation",
        ),
      });
    },
  });
}
