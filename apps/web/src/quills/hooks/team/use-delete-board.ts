import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteBoard,
  type DeleteBoardRequest,
  type DeleteBoardResponse,
} from "../../api/team/delete-board";
export function useDeleteBoard(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<DeleteBoardResponse, PortalProblem, DeleteBoardRequest>({
    mutationFn: (input) => deleteBoard(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listBoards",
        ),
      });
    },
  });
}
