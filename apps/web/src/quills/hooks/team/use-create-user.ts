import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createUser,
  type CreateUserRequest,
  type CreateUserResponse,
} from "../../api/team/create-user";
export function useCreateUser(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<CreateUserResponse, PortalProblem, CreateUserRequest>({
    mutationFn: (input) => createUser(input),
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
