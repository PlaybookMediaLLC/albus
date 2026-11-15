import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateConversationTag,
  type UpdateConversationTagRequest,
  type UpdateConversationTagResponse,
} from "../../api/team/update-conversation-tag";
export function useUpdateConversationTag(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateConversationTagResponse,
    PortalProblem,
    UpdateConversationTagRequest
  >({
    mutationFn: (input) => updateConversationTag(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listConversationTags",
        ),
      });
    },
  });
}
