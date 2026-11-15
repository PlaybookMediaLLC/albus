import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createBoard,
  type CreateBoardRequest,
  type CreateBoardResponse,
} from "../../api/team/create-board";
export function useCreateBoard(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<CreateBoardResponse, PortalProblem, CreateBoardRequest>({
    mutationFn: (input) => createBoard(input),
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
