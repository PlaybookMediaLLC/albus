import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateUser,
  type UpdateUserRequest,
  type UpdateUserResponse,
} from "../../api/team/update-user";
export function useUpdateUser(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<UpdateUserResponse, PortalProblem, UpdateUserRequest>({
    mutationFn: (input) => updateUser(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getUser",
        ),
      });
    },
  });
}
