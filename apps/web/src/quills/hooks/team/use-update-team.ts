import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  updateTeam,
  type UpdateTeamRequest,
  type UpdateTeamResponse,
} from "../../api/team/update-team";
export function useUpdateTeam(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<UpdateTeamResponse, PortalProblem, UpdateTeamRequest>({
    mutationFn: (input) => updateTeam(input),
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
