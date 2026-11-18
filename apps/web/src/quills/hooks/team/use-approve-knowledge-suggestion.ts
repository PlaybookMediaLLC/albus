import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  approveKnowledgeSuggestion,
  type ApproveKnowledgeSuggestionRequest,
  type ApproveKnowledgeSuggestionResponse,
} from "../../api/team/approve-knowledge-suggestion";
export function useApproveKnowledgeSuggestion(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    ApproveKnowledgeSuggestionResponse,
    PortalProblem,
    ApproveKnowledgeSuggestionRequest
  >({
    mutationFn: (input) => approveKnowledgeSuggestion(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listKnowledgeSuggestions",
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getKnowledgeSuggestion",
        ),
      });
    },
  });
}
