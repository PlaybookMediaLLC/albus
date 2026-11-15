import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setWorkflowAbandonedAutoClose,
  type SetWorkflowAbandonedAutoCloseRequest,
  type SetWorkflowAbandonedAutoCloseResponse,
} from "../../api/team/set-workflow-abandoned-auto-close";
export function useSetWorkflowAbandonedAutoClose(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetWorkflowAbandonedAutoCloseResponse,
    PortalProblem,
    SetWorkflowAbandonedAutoCloseRequest
  >({
    mutationFn: (input) => setWorkflowAbandonedAutoClose(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getWorkflowAbandonedAutoClose",
        ),
      });
    },
  });
}
