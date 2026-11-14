import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortalProblem, Viewer } from "../../core/types";
import { quillsOperationKey } from "../../api/keys";
import {
  createImport,
  type CreateImportRequest,
  type CreateImportResponse,
} from "../../api/team/create-import";
export function useCreateImport(viewer: Viewer) {
  const queryClient = useQueryClient();
  return useMutation<CreateImportResponse, PortalProblem, CreateImportRequest>({
    mutationFn: (input) => createImport(input),
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({
        queryKey: quillsOperationKey(
          input.param.workspaceId,
          viewer,
          "team",
          "listImportRuns",
        ),
      });
    },
  });
}
