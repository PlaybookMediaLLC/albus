import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createExportWorkspace,
  type CreateExportWorkspaceRequest,
  type CreateExportWorkspaceResponse,
} from "../../api/team/create-export-workspace";
export function useCreateExportWorkspace(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateExportWorkspaceResponse,
    PortalProblem,
    CreateExportWorkspaceRequest
  >({
    mutationFn: (input) => createExportWorkspace(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listExportRuns",
        ),
      });
    },
  });
}
