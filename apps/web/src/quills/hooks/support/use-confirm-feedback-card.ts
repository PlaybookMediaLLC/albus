import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  confirmFeedbackCard,
  type ConfirmFeedbackCardRequest,
  type ConfirmFeedbackCardResponse,
} from "../../api/support/confirm-feedback-card";
export function useConfirmFeedbackCard(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    ConfirmFeedbackCardResponse,
    PortalProblem,
    ConfirmFeedbackCardRequest
  >({
    mutationFn: (input) => confirmFeedbackCard(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspace,
          viewer,
          "support",
          "listMyConversationMessages",
        ),
      });
    },
  });
}
