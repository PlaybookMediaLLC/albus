import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  deleteIntegration,
  type DeleteIntegrationRequest,
  type DeleteIntegrationResponse,
} from "../../api/team/delete-integration";
export function useDeleteIntegration(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteIntegrationResponse,
    PortalProblem,
    DeleteIntegrationRequest
  >({
    mutationFn: (input) => deleteIntegration(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listIntegrations",
        ),
      });
    },
  });
}
