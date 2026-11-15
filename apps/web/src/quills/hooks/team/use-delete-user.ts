import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteUser,
  type DeleteUserRequest,
  type DeleteUserResponse,
} from "../../api/team/delete-user";
export function useDeleteUser(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<DeleteUserResponse, PortalProblem, DeleteUserRequest>({
    mutationFn: (input) => deleteUser(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listUsers",
        ),
      });
    },
  });
}
