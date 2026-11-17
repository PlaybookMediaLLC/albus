import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  clearBoardDelivery,
  type ClearBoardDeliveryRequest,
  type ClearBoardDeliveryResponse,
} from "../../api/team/clear-board-delivery";
export function useClearBoardDelivery(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    ClearBoardDeliveryResponse,
    PortalProblem,
    ClearBoardDeliveryRequest
  >({
    mutationFn: (input) => clearBoardDelivery(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getBoardSettings",
        ),
      });
    },
  });
}
