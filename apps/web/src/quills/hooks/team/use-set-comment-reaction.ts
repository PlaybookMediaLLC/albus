import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setCommentReaction,
  type SetCommentReactionRequest,
  type SetCommentReactionResponse,
} from "../../api/team/set-comment-reaction";
export function useSetCommentReaction(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetCommentReactionResponse,
    PortalProblem,
    SetCommentReactionRequest
  >({
    mutationFn: (input) => setCommentReaction(input),
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
