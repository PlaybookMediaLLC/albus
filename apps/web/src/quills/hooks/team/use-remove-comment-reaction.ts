import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  removeCommentReaction,
  type RemoveCommentReactionRequest,
  type RemoveCommentReactionResponse,
} from "../../api/team/remove-comment-reaction";
export function useRemoveCommentReaction(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    RemoveCommentReactionResponse,
    PortalProblem,
    RemoveCommentReactionRequest
  >({
    mutationFn: (input) => removeCommentReaction(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listPostComments",
        ),
      });
    },
  });
}
