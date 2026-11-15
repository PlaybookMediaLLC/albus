import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateTeamBinding,
  type UpdateTeamBindingRequest,
  type UpdateTeamBindingResponse,
} from "../../api/team/update-team-binding";
export function useUpdateTeamBinding(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateTeamBindingResponse,
    PortalProblem,
    UpdateTeamBindingRequest
  >({
    mutationFn: (input) => updateTeamBinding(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listTeams",
        ),
      });
    },
  });
}
