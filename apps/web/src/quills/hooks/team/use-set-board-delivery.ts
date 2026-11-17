import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setBoardDelivery,
  type SetBoardDeliveryRequest,
  type SetBoardDeliveryResponse,
} from "../../api/team/set-board-delivery";
export function useSetBoardDelivery(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetBoardDeliveryResponse,
    PortalProblem,
    SetBoardDeliveryRequest
  >({
    mutationFn: (input) => setBoardDelivery(input),
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
