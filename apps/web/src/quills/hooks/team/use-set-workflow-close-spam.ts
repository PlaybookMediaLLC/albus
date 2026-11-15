import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  setWorkflowCloseSpam,
  type SetWorkflowCloseSpamRequest,
  type SetWorkflowCloseSpamResponse,
} from "../../api/team/set-workflow-close-spam";
export function useSetWorkflowCloseSpam(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    SetWorkflowCloseSpamResponse,
    PortalProblem,
    SetWorkflowCloseSpamRequest
  >({
    mutationFn: (input) => setWorkflowCloseSpam(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "getWorkflowCloseSpam",
        ),
      });
    },
  });
}
